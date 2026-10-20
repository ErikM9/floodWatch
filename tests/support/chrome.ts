import { vi } from 'vitest';

type Listener = (...args: never[]) => unknown;

const EXTENSION_ID = 'gknpmhjcafnbdkfgjhnnlmnpbiahdhep';

/* Holds the work started by listeners and callbacks, so a test can wait until the extension has finished reacting */
const pending = new Set<Promise<void>>();
const failures: unknown[] = [];

/* Times of the events and extension API calls, the only things that keep Chrome from stopping a quiet service worker */
const activity: number[] = [];
const markActivity = () => activity.push(Date.now());

function track(work: unknown) {
  if (!(work instanceof Promise)) return;
  const settled = work.then(
    () => undefined,
    (error) => {
      failures.push(error);
    },
  );
  pending.add(settled);
  settled.finally(() => pending.delete(settled));
}

/* Chrome runs callbacks after the call returns, so these do too */
function reply<T>(value: T, callback?: (value: T) => void) {
  markActivity();
  if (!callback) return Promise.resolve(value);
  track(
    new Promise<void>((resolve) =>
      setTimeout(() => {
        callback(value);
        resolve();
      }),
    ),
  );
}

class ChromeEvent<T extends Listener> {
  private readonly listeners = new Set<T>();

  addListener(listener: T) {
    this.listeners.add(listener);
  }

  removeListener(listener: T) {
    this.listeners.delete(listener);
  }

  dispatch(...args: Parameters<T>) {
    markActivity();
    for (const listener of [...this.listeners]) track(listener(...args));
  }
}

type StorageChanges = Record<string, chrome.storage.StorageChange>;

/* Stores values as JSON and reports only the keys whose value changes, as Chrome does */
class StorageArea {
  private readonly items = new Map<string, string>();

  constructor(
    private readonly areaName: string,
    private readonly onChanged: ChromeEvent<
      (changes: StorageChanges, areaName: string) => void
    >,
  ) {}

  get(
    keys?: string | string[] | null,
    callback?: (items: Record<string, unknown>) => void,
  ) {
    const names =
      keys == null ? [...this.items.keys()] : ([] as string[]).concat(keys);
    const result: Record<string, unknown> = {};

    for (const name of names) {
      const stored = this.items.get(name);
      if (stored !== undefined) result[name] = JSON.parse(stored);
    }

    return reply(result, callback);
  }

  set(items: Record<string, unknown>, callback?: () => void) {
    const changes: StorageChanges = {};

    for (const [key, value] of Object.entries(items)) {
      const stored = JSON.stringify(value);
      const previous = this.items.get(key);

      if (stored !== previous) {
        changes[key] = {
          newValue: JSON.parse(stored),
          ...(previous !== undefined && { oldValue: JSON.parse(previous) }),
        };
        this.items.set(key, stored);
      }
    }

    if (Object.keys(changes).length) {
      track(
        new Promise<void>((resolve) =>
          setTimeout(() => {
            this.onChanged.dispatch(changes, this.areaName);
            resolve();
          }),
        ),
      );
    }

    return reply(undefined, callback);
  }
}

function createChrome() {
  const alarms = new Map<string, chrome.alarms.Alarm>();
  const createdNotifications: chrome.notifications.NotificationOptions[] = [];
  const shownNotifications = new Map<
    string,
    chrome.notifications.NotificationOptions
  >();
  const onAlarm = new ChromeEvent<(alarm: chrome.alarms.Alarm) => unknown>();
  const onChanged = new ChromeEvent<
    (changes: StorageChanges, areaName: string) => unknown
  >();
  const onInstalled = new ChromeEvent<
    (details: chrome.runtime.InstalledDetails) => unknown
  >();
  const onStartup = new ChromeEvent<() => unknown>();

  const api = {
    alarms: {
      create(name: string, info: chrome.alarms.AlarmCreateInfo) {
        const delay = info.delayInMinutes ?? info.periodInMinutes ?? 0;
        alarms.set(name, {
          name,
          scheduledTime: info.when ?? Date.now() + delay * 60_000,
          periodInMinutes: info.periodInMinutes,
        });
        return reply(undefined);
      },
      get(name: string) {
        return reply(alarms.get(name));
      },
      onAlarm,
    },
    notifications: {
      create(id: string, options: chrome.notifications.NotificationOptions) {
        const missing = ['type', 'iconUrl', 'title', 'message'].filter(
          (key) => !(key in options),
        );
        if (missing.length) {
          return Promise.reject(
            new Error(`Missing notification properties: ${missing.join(', ')}`),
          );
        }
        /* Chrome makes up an ID when given none, and a notification with an ID already on screen replaces it */
        const shownId = id || crypto.randomUUID();
        shownNotifications.delete(shownId);
        shownNotifications.set(shownId, options);
        createdNotifications.push(options);
        return reply(shownId);
      },
    },
    runtime: {
      id: EXTENSION_ID,
      getURL: (path: string) =>
        `chrome-extension://${EXTENSION_ID}/${path.replace(/^\//, '')}`,
      getPlatformInfo: () =>
        reply({ os: 'linux', arch: 'x86-64', nacl_arch: 'x86-64' }),
      onInstalled,
      onStartup,
    },
    storage: {
      local: new StorageArea('local', onChanged),
      onChanged,
    },
  };

  return {
    api,
    /* Every notification created so far, in order, including those since replaced */
    notifications: createdNotifications,
    onScreen: () => [...shownNotifications.values()],
    fireAlarm(name: string) {
      const alarm = alarms.get(name);
      if (!alarm) throw new Error(`No alarm called ${name} has been created`);
      onAlarm.dispatch(alarm);
    },
    install: () =>
      onInstalled.dispatch({
        reason: 'install',
      } as chrome.runtime.InstalledDetails),
    startUp: () => onStartup.dispatch(),
    /* The longest the worker has gone without an event or an extension API call */
    longestQuietSpell: () =>
      Math.max(0, ...activity.slice(1).map((time, i) => time - activity[i])),
    lastActivity: () => activity.at(-1),
    /* Resolves once every listener and callback has finished, and fails with the first error any of them threw */
    async idle() {
      while (pending.size) await Promise.all([...pending]);
      if (failures.length) throw failures[0];
    },
  };
}

let current: ReturnType<typeof createChrome>;

export function installChrome() {
  pending.clear();
  failures.length = 0;
  activity.length = 0;
  current = createChrome();
  vi.stubGlobal('chrome', current.api);
}

export const fakeChrome = () => current;
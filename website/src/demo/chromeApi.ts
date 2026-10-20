import { ChangeListener, DemoRuntime } from './runtime';

type Items = Record<string, unknown>;
type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) => void;

/* Builds the chrome object in the window that calls it, so the extension's code there works with objects of its own */
export function createChromeApi(runtime: DemoRuntime, owner: Window) {
  const changeListeners = new Map<StorageListener, ChangeListener>();

  /* Drops the storage listeners of a page as it closes, but not of one the browser keeps for the back button */
  owner.addEventListener('pagehide', (event) => {
    if (!event.persisted) {
      changeListeners.forEach((wrapper) =>
        runtime.removeChangeListener(wrapper),
      );
    }
  });

  return {
    storage: {
      local: {
        /* Chrome runs a callback after the call returns, so this one does too */
        get(keys: string[], callback?: (items: Items) => void) {
          const items = JSON.parse(runtime.getItems(keys)) as Items;
          if (!callback) return Promise.resolve(items);
          setTimeout(() => callback(items));
        },
        set(items: Items) {
          runtime.setItems(JSON.stringify(items));
          return Promise.resolve();
        },
      },
      onChanged: {
        addListener(listener: StorageListener) {
          const wrapper: ChangeListener = (changes, areaName) =>
            listener(JSON.parse(changes), areaName);
          changeListeners.set(listener, wrapper);
          runtime.addChangeListener(wrapper);
        },
        removeListener(listener: StorageListener) {
          runtime.removeChangeListener(changeListeners.get(listener)!);
        },
      },
    },
    alarms: {
      get(name: string) {
        const alarm = runtime.getAlarm(name);
        return Promise.resolve(
          alarm && (JSON.parse(alarm) as chrome.alarms.Alarm),
        );
      },
      create(name: string, { periodInMinutes }: { periodInMinutes: number }) {
        runtime.createAlarm(name, periodInMinutes);
      },
      onAlarm: {
        addListener: (listener: (alarm: chrome.alarms.Alarm) => unknown) =>
          runtime.addAlarmListener((alarm) => listener(JSON.parse(alarm))),
      },
    },
    notifications: {
      create(id: string, options: object) {
        runtime.createNotification(id, JSON.stringify(options));
      },
    },
    runtime: {
      getURL: (path: string) => runtime.getURL(path),
      /* The extension only calls this to stay awake while it works, so it needs no answer */
      getPlatformInfo() {},
      openOptionsPage() {
        runtime.openOptionsPage();
      },
      onInstalled: {
        addListener: (listener: () => unknown) =>
          runtime.addInstallListener(listener),
      },
      /* A page has no browser start of its own, so the install event runs the first check */
      onStartup: {
        addListener: () => undefined,
      },
    },
  };
}

/* The extension calls a global named chrome, whose extension APIs a web page doesn't have */
export function installChrome(api: ReturnType<typeof createChromeApi>) {
  (globalThis as unknown as { chrome: unknown }).chrome = api;
}
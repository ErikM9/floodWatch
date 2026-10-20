/* Values cross between the page and its frames as JSON text, so each window builds objects of its own from them */
export type ChangeListener = (changes: string, areaName: string) => void;
export type AlarmListener = (alarm: string) => unknown;
export type InstallListener = () => unknown;

export interface DemoNotification {
  id: string;
  title: string;
  message: string;
  iconUrl: string;
}

export interface RuntimeHooks {
  notify: (notification: DemoNotification) => void;
  openOptionsPage: () => void;
  getURL: (path: string) => string;
  /* Runs once the extension has finished reacting to an install or an alarm */
  settled: () => void;
}

interface Alarm {
  name: string;
  scheduledTime: number;
  periodInMinutes: number;
}

/* Stands in for the parts of Chrome the extension uses, shared by the page and its demo frames */
export class DemoRuntime {
  private readonly items = new Map<string, string>();
  private readonly changeListeners = new Set<ChangeListener>();
  private readonly alarmListeners = new Set<AlarmListener>();
  private readonly installListeners = new Set<InstallListener>();
  private readonly alarms = new Map<
    string,
    { alarm: Alarm; timer: ReturnType<typeof setTimeout> }
  >();

  constructor(private readonly hooks: RuntimeHooks) {}

  getItems(keys: string[]): string {
    const result: Record<string, unknown> = {};

    for (const key of keys) {
      const stored = this.items.get(key);
      if (stored !== undefined) result[key] = JSON.parse(stored);
    }

    return JSON.stringify(result);
  }

  /* Reports only the keys whose value changes, after the call returns, as Chrome does */
  setItems(items: string): void {
    const changes: Record<string, { oldValue?: unknown; newValue: unknown }> =
      {};

    for (const [key, value] of Object.entries(
      JSON.parse(items) as Record<string, unknown>,
    )) {
      const stored = JSON.stringify(value);
      const previous = this.items.get(key);

      if (stored !== previous) {
        changes[key] = {
          newValue: value,
          ...(previous !== undefined && { oldValue: JSON.parse(previous) }),
        };
        this.items.set(key, stored);
      }
    }

    if (Object.keys(changes).length) {
      const message = JSON.stringify(changes);
      setTimeout(() =>
        this.dispatch(this.changeListeners, (listener) =>
          listener(message, 'local'),
        ),
      );
    }
  }

  addChangeListener(listener: ChangeListener): void {
    this.changeListeners.add(listener);
  }

  removeChangeListener(listener: ChangeListener): void {
    this.changeListeners.delete(listener);
  }

  getAlarm(name: string): string | undefined {
    const scheduled = this.alarms.get(name);
    return scheduled && JSON.stringify(scheduled.alarm);
  }

  /* An alarm first goes off one period after it is created, and an alarm with a name in use replaces the earlier one */
  createAlarm(name: string, periodInMinutes: number): void {
    clearTimeout(this.alarms.get(name)?.timer);
    const period = periodInMinutes * 60_000;
    const timer = setTimeout(() => this.fire(name), period);
    this.alarms.set(name, {
      alarm: { name, scheduledTime: Date.now() + period, periodInMinutes },
      timer,
    });
  }

  addAlarmListener(listener: AlarmListener): void {
    this.alarmListeners.add(listener);
  }

  createNotification(id: string, options: string): void {
    const { title, message, iconUrl } = JSON.parse(options) as Omit<
      DemoNotification,
      'id'
    >;
    this.hooks.notify({ id, title, message, iconUrl });
  }

  openOptionsPage(): void {
    this.hooks.openOptionsPage();
  }

  getURL(path: string): string {
    return this.hooks.getURL(path);
  }

  addInstallListener(listener: InstallListener): void {
    this.installListeners.add(listener);
  }

  /* Opening the page is the demo's install, so this runs the extension's first check */
  install(): Promise<void> {
    return this.dispatch(this.installListeners, (listener) => listener()).then(
      this.hooks.settled,
    );
  }

  private fire(name: string) {
    const { alarm } = this.alarms.get(name)!;
    this.createAlarm(name, alarm.periodInMinutes);
    const message = JSON.stringify(alarm);
    void this.dispatch(this.alarmListeners, (listener) =>
      listener(message),
    ).then(this.hooks.settled);
  }

  /* Calls each listener on its own and waits for its work, so one that fails doesn't stop the rest */
  private dispatch<T>(
    listeners: Set<T>,
    call: (listener: T) => unknown,
  ): Promise<void> {
    return Promise.allSettled(
      [...listeners].map(async (listener) => call(listener)),
    ).then(() => undefined);
  }
}
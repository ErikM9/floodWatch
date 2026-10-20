import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createChromeApi } from '../../../website/src/demo/chromeApi';
import { DemoRuntime } from '../../../website/src/demo/runtime';

const newWindow = () => new EventTarget() as unknown as Window;

const newHooks = () => ({
  notify: vi.fn(),
  openOptionsPage: vi.fn(),
  getURL: (path: string) => `https://erikm9.github.io/floodWatch/${path}`,
  settled: vi.fn(),
});

let hooks: ReturnType<typeof newHooks>;
let runtime: DemoRuntime;
let api: ReturnType<typeof createChromeApi>;

beforeEach(() => {
  vi.useFakeTimers();
  hooks = newHooks();
  runtime = new DemoRuntime(hooks);
  api = createChromeApi(runtime, newWindow());
});

describe('the stand-in for Chrome', () => {
  it('gives back the stored values asked for, leaving out keys never set', async () => {
    await api.storage.local.set({
      alertsEnabled: true,
      userLocation: [53.96, -1.08],
    });

    const items = await api.storage.local.get([
      'userLocation',
      'lastSentAlert',
    ]);

    expect(items).toEqual({ userLocation: [53.96, -1.08] });
  });

  it('hands out copies, so changing a value it gave back changes nothing stored', async () => {
    await api.storage.local.set({ userLocation: [53.96, -1.08] });
    const { userLocation } = (await api.storage.local.get([
      'userLocation',
    ])) as {
      userLocation: number[];
    };

    userLocation[0] = 0;

    expect(await api.storage.local.get(['userLocation'])).toEqual({
      userLocation: [53.96, -1.08],
    });
  });

  it('runs a callback after the call returns, as Chrome does', () => {
    const callback = vi.fn();

    api.storage.local.get(['alertsEnabled'], callback);
    const calledStraightAway = callback.mock.calls.length;
    vi.runAllTimers();

    expect(calledStraightAway).toBe(0);
    expect(callback).toHaveBeenCalledWith({});
  });

  it('reports the keys whose value changed, with the old and new values, once the call has returned', async () => {
    await api.storage.local.set({ alertsEnabled: false, lastSentAlert: null });
    vi.runAllTimers();
    const listener = vi.fn();
    api.storage.onChanged.addListener(listener);

    await api.storage.local.set({ alertsEnabled: true, lastSentAlert: null });
    const calledStraightAway = listener.mock.calls.length;
    vi.runAllTimers();
    await api.storage.local.set({ alertsEnabled: true });
    vi.runAllTimers();

    expect(calledStraightAway).toBe(0);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(
      { alertsEnabled: { oldValue: false, newValue: true } },
      'local',
    );
  });

  it('stops telling a listener about changes once it is removed', async () => {
    const kept = vi.fn();
    const removed = vi.fn();
    api.storage.onChanged.addListener(kept);
    api.storage.onChanged.addListener(removed);

    api.storage.onChanged.removeListener(removed);
    await api.storage.local.set({ alertsEnabled: true });
    vi.runAllTimers();

    expect(kept).toHaveBeenCalledOnce();
    expect(removed).not.toHaveBeenCalled();
  });

  it("stops telling a frame's listeners about changes once the frame closes", async () => {
    const listener = vi.fn();
    const frame = newWindow();
    createChromeApi(runtime, frame).storage.onChanged.addListener(listener);

    frame.dispatchEvent(
      new PageTransitionEvent('pagehide', { persisted: false }),
    );
    await api.storage.local.set({ alertsEnabled: true });
    vi.runAllTimers();

    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps telling the listeners of a page the browser keeps for the back button', async () => {
    const listener = vi.fn();
    const page = newWindow();
    createChromeApi(runtime, page).storage.onChanged.addListener(listener);

    page.dispatchEvent(
      new PageTransitionEvent('pagehide', { persisted: true }),
    );
    await api.storage.local.set({ alertsEnabled: true });
    vi.runAllTimers();

    expect(listener).toHaveBeenCalledOnce();
  });

  it('sets off an alarm one period after it is created and every period after that', () => {
    const listener = vi.fn();
    api.alarms.onAlarm.addListener(listener);

    api.alarms.create('checkFloods', { periodInMinutes: 1 });
    vi.advanceTimersByTime(59_999);
    const firedEarly = listener.mock.calls.length;
    vi.advanceTimersByTime(60_001);

    expect(firedEarly).toBe(0);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'checkFloods' }),
    );
  });

  it('describes an alarm by its name, the time it next goes off and its period', async () => {
    const created = Date.now();
    api.alarms.create('checkFloods', { periodInMinutes: 1 });

    const alarm = await api.alarms.get('checkFloods');

    expect(alarm).toEqual({
      name: 'checkFloods',
      scheduledTime: created + 60_000,
      periodInMinutes: 1,
    });
  });

  it('replaces an alarm created again under the same name', () => {
    const listener = vi.fn();
    api.alarms.onAlarm.addListener(listener);

    api.alarms.create('checkFloods', { periodInMinutes: 1 });
    vi.advanceTimersByTime(30_000);
    api.alarms.create('checkFloods', { periodInMinutes: 1 });
    vi.advanceTimersByTime(59_999);
    const firedEarly = listener.mock.calls.length;
    vi.advanceTimersByTime(1);

    expect(firedEarly).toBe(0);
    expect(listener).toHaveBeenCalledOnce();
  });

  it('has no alarm under a name never used', async () => {
    api.alarms.create('checkFloods', { periodInMinutes: 1 });

    const alarm = await api.alarms.get('somethingElse');

    expect(alarm).toBeUndefined();
  });

  it('tells the page once the work started by an install or an alarm is done, even when some of it fails', async () => {
    let finishDownload!: () => void;
    api.runtime.onInstalled.addListener(
      () => new Promise<void>((resolve) => (finishDownload = resolve)),
    );
    api.runtime.onInstalled.addListener(() => {
      throw new Error('A listener failed');
    });
    api.alarms.onAlarm.addListener(() => Promise.reject(new Error('Offline')));
    api.alarms.create('checkFloods', { periodInMinutes: 1 });

    const installed = runtime.install();
    await vi.advanceTimersByTimeAsync(0);
    const settledBeforeDownload = hooks.settled.mock.calls.length;
    finishDownload();
    await installed;
    await vi.advanceTimersByTimeAsync(60_000);

    expect(settledBeforeDownload).toBe(0);
    expect(hooks.settled).toHaveBeenCalledTimes(2);
  });

  it('passes a notification on to the page with its title, message and icon', () => {
    api.notifications.create('flood-alert', {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Your area at risk!',
      message: 'Warning: Flood warning.',
      priority: 2,
    });

    expect(hooks.notify).toHaveBeenCalledWith({
      id: 'flood-alert',
      iconUrl: 'icon.png',
      title: 'Your area at risk!',
      message: 'Warning: Flood warning.',
    });
  });

  it('passes a request for the settings page on to the page', () => {
    api.runtime.openOptionsPage();

    expect(hooks.openOptionsPage).toHaveBeenCalledOnce();
  });

  it('asks the page for the address of a file in the extension', () => {
    const address = api.runtime.getURL('public/128.png');

    expect(address).toBe('https://erikm9.github.io/floodWatch/public/128.png');
  });
});
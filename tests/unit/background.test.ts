import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { fakeChrome } from '../support/chrome';
import {
  FLOOD_AREAS_URL,
  FLOODS_URL,
  floodItem,
  fossWarningArea,
  locations,
  ouseAlertArea,
  polygonResponse,
  severnAlertArea,
} from '../support/floodData';
import {
  requests,
  server,
  serveFloods,
  serviceUnavailable,
} from '../support/server';

/* Wraps the database read in a spy that still reads the real fake-indexeddb database */
vi.mock('@/chrome-extension/services/floodDatabase', async (importOriginal) => {
  const database =
    await importOriginal<
      typeof import('@/chrome-extension/services/floodDatabase')
    >();
  return {
    ...database,
    getFloodWarningsFromDB: vi.fn(database.getFloodWarningsFromDB),
  };
});

async function startExtension() {
  vi.resetModules();
  await import('@/chrome-extension/background');
}

async function saveSettings(settings: Record<string, unknown>) {
  await chrome.storage.local.set(settings);
  await fakeChrome().idle();
}

async function runScheduledCheck() {
  fakeChrome().fireAlarm('checkFloods');
  await fakeChrome().idle();
}

const recordedAlert = async () =>
  (await chrome.storage.local.get('lastSentAlert')).lastSentAlert;

const notificationMessages = () =>
  fakeChrome().notifications.map((notification) => notification.message);

const requestsTo = (url: string) =>
  requests.filter((request) => request === url);

const outlineUrl = `${FLOOD_AREAS_URL}/${fossWarningArea.id}/polygon`;

describe('background', () => {
  it('checks the flood warnings every minute', async () => {
    await startExtension();

    expect(await chrome.alarms.get('checkFloods')).toMatchObject({
      periodInMinutes: 1,
    });
  });

  it('keeps the minute already counting when the service worker starts again', async () => {
    await chrome.alarms.create('checkFloods', {
      periodInMinutes: 1,
      when: 1_700_000_030_000,
    });

    await startExtension();

    expect(await chrome.alarms.get('checkFloods')).toMatchObject({
      scheduledTime: 1_700_000_030_000,
    });
  });

  it.each([
    ['installed', () => fakeChrome().install()],
    ['started', () => fakeChrome().startUp()],
  ])(
    'downloads the warnings once %s and records the one covering the saved location',
    async (_event, start) => {
      serveFloods(floodItem(fossWarningArea, 2, 'Flooding is expected.'));
      await saveSettings({ userLocation: locations.yorkCityCentre });
      await startExtension();

      start();
      await fakeChrome().idle();

      expect(await recordedAlert()).toEqual({
        id: '122FWF738',
        description: 'River Foss at York city centre',
        county: 'York',
        severity: 'Flood warning',
        severityLevel: 2,
        message: 'Flooding is expected.',
        riverOrSea: 'River Foss',
        timeMessageChanged: '2024-11-25T09:15:00',
      });
    },
  );

  it('records no alert for a location saved before any warnings are downloaded', async () => {
    await startExtension();

    await saveSettings({ userLocation: locations.yorkCityCentre });

    expect(await recordedAlert()).toBeFalsy();
  });

  it('records no alert until a location is saved', async () => {
    serveFloods(floodItem(fossWarningArea, 2));
    await startExtension();

    await runScheduledCheck();

    expect(await recordedAlert()).toBeFalsy();
  });

  it('notifies when alerts are on and a warning reaches the saved location', async () => {
    await saveSettings({
      alertsEnabled: true,
      userLocation: locations.yorkCityCentre,
    });
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2));

    await runScheduledCheck();

    expect(fakeChrome().notifications).toEqual([
      {
        type: 'basic',
        iconUrl: `chrome-extension://${chrome.runtime.id}/public/128.png`,
        title: 'Your area at risk!',
        message: 'Warning: Flood warning.',
        priority: 2,
        requireInteraction: true,
      },
    ]);
  });

  it('records the warning without a notification while alerts are off', async () => {
    await saveSettings({ userLocation: locations.yorkCityCentre });
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2));

    await runScheduledCheck();

    expect(await recordedAlert()).toMatchObject({ id: '122FWF738' });
    expect(fakeChrome().notifications).toEqual([]);
  });

  it('notifies about the warning in force when alerts are turned on', async () => {
    await saveSettings({ userLocation: locations.yorkCityCentre });
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 1));
    await runScheduledCheck();

    await saveSettings({ alertsEnabled: true });

    expect(notificationMessages()).toEqual(['Warning: Severe flood warning.']);
  });

  it('notifies about the warning at a newly saved location, even at the level already recorded', async () => {
    await saveSettings({
      alertsEnabled: true,
      userLocation: locations.yorkCityCentre,
    });
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2), floodItem(severnAlertArea, 2));
    await runScheduledCheck();

    await saveSettings({ userLocation: locations.tewkesbury });

    expect(await recordedAlert()).toMatchObject({ id: '031WAF110' });
    expect(notificationMessages()).toEqual([
      'Warning: Flood warning.',
      'Warning: Flood warning.',
    ]);
  });

  it('notifies once while the warning stays the same', async () => {
    await saveSettings({
      alertsEnabled: true,
      userLocation: locations.yorkCityCentre,
    });
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2));

    await runScheduledCheck();
    await runScheduledCheck();

    expect(notificationMessages()).toEqual(['Warning: Flood warning.']);
  });

  it('notifies again when the risk at the location rises, replacing the earlier notification', async () => {
    await saveSettings({
      alertsEnabled: true,
      userLocation: locations.yorkCityCentre,
    });
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 3));
    await runScheduledCheck();

    serveFloods(floodItem(fossWarningArea, 1));
    await runScheduledCheck();

    expect(notificationMessages()).toEqual([
      'Warning: Flood alert.',
      'Warning: Severe flood warning.',
    ]);
    expect(fakeChrome().onScreen()).toEqual([
      expect.objectContaining({ message: 'Warning: Severe flood warning.' }),
    ]);
  });

  it('stays quiet when a lower warning is all that is left at the location', async () => {
    await saveSettings({
      alertsEnabled: true,
      userLocation: locations.yorkCityCentre,
    });
    await startExtension();
    serveFloods(floodItem(ouseAlertArea, 3), floodItem(fossWarningArea, 2));
    await runScheduledCheck();

    serveFloods(floodItem(ouseAlertArea, 3));
    await runScheduledCheck();

    expect(await recordedAlert()).toMatchObject({ id: '122WAF946' });
    expect(notificationMessages()).toEqual(['Warning: Flood warning.']);
  });

  it('records a warning that is no longer in force without notifying', async () => {
    await saveSettings({
      alertsEnabled: true,
      userLocation: locations.tewkesbury,
    });
    await startExtension();
    serveFloods(floodItem(severnAlertArea, 4));

    await runScheduledCheck();

    expect(await recordedAlert()).toMatchObject({
      id: '031WAF110',
      severityLevel: 4,
    });
    expect(fakeChrome().notifications).toEqual([]);
  });

  it('clears the alert once the warning ends', async () => {
    await saveSettings({ userLocation: locations.yorkCityCentre });
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2));
    await runScheduledCheck();

    serveFloods();
    await runScheduledCheck();

    expect(await recordedAlert()).toBeFalsy();
  });

  it('keeps the warnings it has when a download fails, instead of treating the floods as over', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    await saveSettings({
      alertsEnabled: true,
      userLocation: locations.yorkCityCentre,
    });
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2));
    await runScheduledCheck();

    server.use(
      http.get(FLOODS_URL, () => serviceUnavailable(), { once: true }),
    );
    await runScheduledCheck();
    const alertAfterFailure = await recordedAlert();
    await runScheduledCheck();

    expect(alertAfterFailure).toMatchObject({ id: '122FWF738' });
    expect(notificationMessages()).toEqual(['Warning: Flood warning.']);
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it('downloads the outline of each area once', async () => {
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2));

    await runScheduledCheck();
    await runScheduledCheck();

    expect(requestsTo(outlineUrl)).toHaveLength(1);
  });

  it('downloads an outline again after it failed to download', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    await saveSettings({ userLocation: locations.yorkCityCentre });
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2));
    server.use(
      http.get(outlineUrl, () => serviceUnavailable(), { once: true }),
    );
    await runScheduledCheck();

    await runScheduledCheck();

    expect(requestsTo(outlineUrl)).toHaveLength(2);
    expect(await recordedAlert()).toMatchObject({ id: '122FWF738' });
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it('checks a newly saved location straight away against the warnings it has', async () => {
    await saveSettings({ userLocation: locations.leeds });
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2));
    await runScheduledCheck();

    await saveSettings({ userLocation: locations.yorkCityCentre });

    expect(await recordedAlert()).toMatchObject({ id: '122FWF738' });
    expect(requestsTo(FLOODS_URL)).toHaveLength(1);
  });

  it('runs one check at a time, so an earlier check cannot overwrite a later one', async () => {
    await startExtension();
    const { getFloodWarningsFromDB } = await import(
      '@/chrome-extension/services/floodDatabase'
    );
    const { getFloodWarningsFromDB: readDatabase } = await vi.importActual<
      typeof import('@/chrome-extension/services/floodDatabase')
    >('@/chrome-extension/services/floodDatabase');
    const read = vi.mocked(getFloodWarningsFromDB);
    let reading = 0;
    let mostAtOnce = 0;
    read.mockImplementation(async () => {
      reading += 1;
      mostAtOnce = Math.max(mostAtOnce, reading);
      try {
        return await readDatabase();
      } finally {
        reading -= 1;
      }
    });

    await chrome.storage.local.set({ userLocation: locations.leeds });
    await chrome.storage.local.set({ userLocation: locations.tewkesbury });
    await fakeChrome().idle();

    expect(mostAtOnce).toBe(1);
  });

  it('joins an update already under way instead of downloading twice', async () => {
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2));

    fakeChrome().fireAlarm('checkFloods');
    fakeChrome().fireAlarm('checkFloods');
    await fakeChrome().idle();

    expect(requestsTo(FLOODS_URL)).toHaveLength(1);
  });

  it('keeps the service worker awake through a download longer than the 30 seconds Chrome gives a quiet worker', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    let outlineAsked!: () => void;
    const asked = new Promise<void>((resolve) => {
      outlineAsked = resolve;
    });
    let sendOutline!: () => void;
    const sent = new Promise<void>((resolve) => {
      sendOutline = resolve;
    });
    server.use(
      http.get(outlineUrl, async () => {
        outlineAsked();
        await sent;
        return HttpResponse.json(polygonResponse(fossWarningArea));
      }),
    );
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2));

    fakeChrome().fireAlarm('checkFloods');
    await asked;
    vi.advanceTimersByTime(90_000);
    sendOutline();
    await fakeChrome().idle();

    expect(fakeChrome().longestQuietSpell()).toBeLessThan(30_000);
  });

  it('lets the service worker rest once the update is done', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    await startExtension();
    serveFloods(floodItem(fossWarningArea, 2));
    await runScheduledCheck();
    const lastActivity = fakeChrome().lastActivity();

    vi.advanceTimersByTime(120_000);

    expect(fakeChrome().lastActivity()).toBe(lastActivity);
  });
});
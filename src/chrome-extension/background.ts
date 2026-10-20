import { fetchFloodWarnings } from './api/ukFlood';
import {
  getFloodWarningsFromDB,
  storeFloodWarningsInDB,
} from './services/floodDatabase';
import { findUserFlood } from './services/FloodDataService';

import { AlertMessage } from '@/types/types';

interface StorageData {
  alertsEnabled?: boolean;
  lastSentAlert?: AlertMessage | null;
  userLocation?: [number, number];
}

/* Keeps the stored warnings when the download fails, so a dropped connection doesn't read as the floods having ended */
async function storeFloodWarnings(): Promise<void> {
  try {
    const storedFloodData = await getFloodWarningsFromDB();
    const floodWarnings = await fetchFloodWarnings(storedFloodData);

    if (JSON.stringify(floodWarnings) !== JSON.stringify(storedFloodData)) {
      await storeFloodWarningsInDB(floodWarnings);
    }
  } catch (error) {
    console.error('Error fetching and storing flood warnings:', error);
  }
}

async function checkIfUserIsFlooded(settingsChanged: boolean): Promise<void> {
  const { alertsEnabled, lastSentAlert, userLocation } =
    (await chrome.storage.local.get([
      'alertsEnabled',
      'lastSentAlert',
      'userLocation',
    ])) as StorageData;
  const flood = userLocation
    ? findUserFlood(await getFloodWarningsFromDB(), userLocation)
    : null;

  if (!flood) {
    await chrome.storage.local.set({ lastSentAlert: null });
    return;
  }

  const alert: AlertMessage = {
    id: flood.id,
    description: flood.description,
    county: flood.county,
    severity: flood.severity,
    severityLevel: flood.severityLevel,
    message: flood.message,
    riverOrSea: flood.riverOrSea,
    timeMessageChanged: flood.timeMessageChanged,
  };
  /* Any warning is news straight after a new location or alerts being turned on, and otherwise only a rise in level is */
  const previous = settingsChanged ? null : lastSentAlert;
  const isNews = !previous || alert.severityLevel < previous.severityLevel;

  await chrome.storage.local.set({ lastSentAlert: alert });

  /* Level 4 marks a lifted warning, so only the levels still in force notify */
  if (alertsEnabled && isNews && alert.severityLevel < 4) {
    chrome.notifications.create('flood-alert', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('public/128.png'),
      title: 'Your area at risk!',
      message: `Warning: ${alert.severity}.`,
      priority: 2,
      requireInteraction: true,
    });
  }
}

let checks: Promise<void> = Promise.resolve();

/* Runs one check at a time, so an earlier check can't overwrite the outcome of a later one */
function checkInTurn(settingsChanged = false): Promise<void> {
  checks = checks
    .catch(() => undefined)
    .then(() => checkIfUserIsFlooded(settingsChanged));
  return checks;
}

/* Calls an extension API every 25 seconds while the work runs, as Chrome stops a worker after 30 quiet seconds */
async function keepAwake(work: Promise<void>): Promise<void> {
  const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(), 25_000);

  try {
    await work;
  } finally {
    clearInterval(keepAlive);
  }
}

let update: Promise<void> | null = null;

/* Joins an update already under way instead of downloading the warnings a second time */
function updateFloodStatus(): Promise<void> {
  update ??= keepAwake(storeFloodWarnings().then(() => checkInTurn())).finally(
    () => {
      update = null;
    },
  );
  return update;
}

/* Creating the alarm again would restart its minute every time the worker wakes, so it is only created when missing */
chrome.alarms.get('checkFloods').then((alarm) => {
  if (!alarm) {
    chrome.alarms.create('checkFloods', { periodInMinutes: 1 });
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkFloods') {
    await updateFloodStatus();
  }
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (
    areaName === 'local' &&
    (changes.userLocation || changes.alertsEnabled?.newValue)
  ) {
    await checkInTurn(true);
  }
});

chrome.runtime.onInstalled.addListener(() => updateFloodStatus());
chrome.runtime.onStartup.addListener(() => updateFloodStatus());
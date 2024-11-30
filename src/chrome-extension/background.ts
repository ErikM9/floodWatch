import { fetchFloodWarnings } from './api/ukFlood';
import { getAndLogFloodData, isUserFlooded } from './services/FloodDataService';
import { BackgroundPopupMessage } from '@/types/alertMessage';
import { FloodWarning, StorageData } from '@/types/types';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UkFloodWarningDB', 1);

    request.onerror = (event) => {
      reject(`database error: ${(event.target as IDBRequest).error}`);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest).result;
      if (!db.objectStoreNames.contains('floodData')) {
        db.createObjectStore('floodData', { keyPath: 'id' });
        console.log('Created object store: floodData');
      }
    };
  });
}

async function storeFloodWarningsInDB(data: FloodWarning[]): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(['floodData'], 'readwrite');
  const objectStore = transaction.objectStore('floodData');
  objectStore.put({ id: 'floodData', data });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject((event.target as IDBRequest).error);
  });
}

export async function getFloodWarningsFromDB(): Promise<FloodWarning[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['floodData'], 'readonly');
    const objectStore = transaction.objectStore('floodData');
    const request = objectStore.get('floodData');

    request.onerror = (event) => {
      reject(`database error: ${(event.target as IDBRequest).error}`);
    };

    request.onsuccess = () => {
      resolve(request.result?.data || []);
    };
  });
}

async function storeFloodWarnings(): Promise<void> {
  try {
    const floodWarnings = await fetchFloodWarnings();
    console.log('Flood warnings:', floodWarnings);

    const storedFloodData = await getFloodWarningsFromDB();
    console.log('Stored flood data from IndexedDB:', storedFloodData);

    const isDataChanged =
      JSON.stringify(floodWarnings) !== JSON.stringify(storedFloodData);

    if (isDataChanged) {
      await storeFloodWarningsInDB(floodWarnings);
      console.log('Flood data stored in IndexedDB');
    } else {
      console.log('Flood data has not changed');
    }
  } catch (error) {
    console.error('Error fetching and storing flood warnings:', error);
  }
}

async function checkIfUserIsFlooded(): Promise<void> {
  console.log('checkIfUserIsFlooded invoked');

  getAndLogFloodData(async (floodData) => {
    try {
      const result = await isUserFlooded(floodData);
      console.log('Flood data received:', floodData);
      console.log('Flood detection result:', result);

      const popupMessage: BackgroundPopupMessage = {
        id: result?.floodedPolygonData?.id || '',
        severityLevel:
          result?.floodedPolygonData?.severityLevel?.toString() || '',
        severity: result?.floodedPolygonData?.severity || '',
        description: result?.floodedPolygonData?.description || '',
        message: result?.floodedPolygonData?.message || '',
        riverOrSea: result?.floodedPolygonData?.riverOrSea || '',
        county: result?.floodedPolygonData?.county || '',
        timeMessageChanged: result?.floodedPolygonData?.timeMessageChanged || ''
      };

      const { alertsEnabled, lastSentAlert } = await new Promise<StorageData>(
        (resolve) => {
          chrome.storage.local.get(
            ['alertsEnabled', 'lastSentAlert'],
            (data) => {
              resolve({
                alertsEnabled: data.alertsEnabled || false,
                lastSentAlert: data.lastSentAlert || null
              });
            }
          );
        }
      );

      console.log('Last Sent Alert:', lastSentAlert);
      console.log('Current Popup Message:', popupMessage);

      if (result?.isFlooded) {
        chrome.storage.local.set(
          {
            lastSentAlert: popupMessage,
            isActiveFlood: true
          },
          () => {
            console.log('Flood report updated in storage:', popupMessage);
          }
        );

        if (alertsEnabled) {
          if (
            lastSentAlert &&
            lastSentAlert.id &&
            lastSentAlert.id === popupMessage.id
          ) {
            console.log(
              'The alert is still the same. No new notification sent.'
            );
            return;
          }

          chrome.notifications.create('flood-alert', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('public/32.png'),
            title: 'Your area at risk!',
            message: `Warning: ${result.floodedPolygonData?.severity || ''}.`,
            priority: 2,
            requireInteraction: true
          });
        } else {
          console.log('Alerts are off. No notification sent.');
        }
      } else {
        console.log('No flooding detected.');

        chrome.storage.local.set(
          {
            isActiveFlood: false,
            lastSentAlert: null
          },
          () => {
            console.log('Marked flood as inactive in storage.');
          }
        );
      }
    } catch (error) {
      console.error('Error while checking flood status:', error);
    }
  });
}

async function initializeExtension() {
  console.log('Initializing extension...');

  const isFirstRun = await new Promise((resolve) => {
    chrome.storage.local.get('isFirstRun', (data) => resolve(data.isFirstRun));
  });

  if (!isFirstRun) {
    console.log('first run detected. Storing flood warnings!!!');
    await storeFloodWarnings();
    chrome.storage.local.set({ isFirstRun: true });
  } else {
    console.log('Subsequent run. Skipping initialization warnings.');
  }

  await checkIfUserIsFlooded();
}

chrome.alarms.create('checkFloods', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkFloods') {
    console.log('Alarm triggered!');

    await storeFloodWarnings();

    const alertsEnabled = await new Promise((resolve) => {
      chrome.storage.local.get('alertsEnabled', (result) => {
        resolve(result.alertsEnabled || false);
      });
    });

    if (alertsEnabled) {
      await checkIfUserIsFlooded();
    } else {
      console.log('disabled alerts. No flood check.');
    }
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.alertsEnabled) {
      const isEnabled = changes.alertsEnabled.newValue;
      console.log(`Alerts enabled: ${isEnabled}`);

      if (isEnabled) {
        chrome.alarms.create('checkFloods', { periodInMinutes: 1 });
        console.log('Flood check alarm created');
      }
    }

    if (changes.userLocation) {
      console.log('User location changed', changes.userLocation.newValue);
      checkIfUserIsFlooded();
    }
  }
});

chrome.runtime.onInstalled.addListener(() => initializeExtension());
chrome.runtime.onStartup.addListener(() => initializeExtension());

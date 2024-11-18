import { fetchFloodWarnings } from './api/testApi';
// import fetchFloodData from './api/ukFloodAPI';
import { getAndLogFloodData, isUserFlooded } from './services/FloodDataService';
import isEqual from 'lodash/isEqual';

interface StorageData {
  alertsEnabled?: boolean;
  lastSentAlert?: any;
}

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
        console.log('created object store: floodData');
      }
    };
  });
}

async function storeFloodWarningsInDB(data: any): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(['floodData'], 'readwrite');
  const objectStore = transaction.objectStore('floodData');
  objectStore.put({ id: 'floodData', data });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject((event.target as IDBRequest).error);
  });
}

export async function getFloodWarningsFromDB(): Promise<any> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['floodData'], 'readonly');
    const objectStore = transaction.objectStore('floodData');
    const request = objectStore.get('floodData');
    console.log('floodData from indexedDB', request);

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
    console.log('flood warnings:', floodWarnings);

    const storedFloodData = await getFloodWarningsFromDB();
    console.log('stored flood data from indexedDB:', storedFloodData);

    const isDataChanged =
      JSON.stringify(floodWarnings) !== JSON.stringify(storedFloodData);

    if (isDataChanged) {
      await storeFloodWarningsInDB(floodWarnings);
      console.log('flood data stored in IndexedDB');
    } else {
      console.log('flood data has not changed');
    }
  } catch (error) {
    console.error('error fetching and storing flood warnings:', error);
  }
}

//TODO switch back to 15min
// chrome.alarms.create('checkFloods', { periodInMinutes: 1 });
chrome.alarms.create('checkFloods', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkFloods') {
    await storeFloodWarnings();
  }
});
// chrome.alarms.onAlarm.addListener(async (alarm) => {
//   if (alarm.name === 'checkFloods') {
//     await storeFloodWarnings();
//   }
// });

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.userLocation) {
    console.log('user location changed', changes.userLocation.newValue);
    checkIfUserIsFlooded();
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log("chrome has started, checking if it's the first run...");

  chrome.storage.local.get('isFirstRun', async (result) => {
    if (!result.isFirstRun) {
      console.log(
        'This is the first time Chrome is opened, triggering storeFloodWarnings...'
      );

      await storeFloodWarnings();

      chrome.storage.local.set({ isFirstRun: true });
    } else {
      console.log('Not the first time, skipping storeFloodWarnings.');
    }
  });
});

async function checkIfUserIsFlooded() {
  console.log('checkIfUserIsFlooded invoked');

  getAndLogFloodData(async (floodData) => {
    try {
      const result = await isUserFlooded(floodData);
      console.log('Flood data received:', floodData);
      console.log('Flood detection result:', result);

      if (result?.isFlooded) {
        console.log('Flood alert:', result.floodedPolygonData);

        const popupMessage = {
          severityLevel:
            result.floodedPolygonData?.severityLevel?.toString() || '',
          description: result.floodedPolygonData?.description || '',
          severity: result.floodedPolygonData?.severity || ''
        };

        const { alertsEnabled, lastSentAlert } = await new Promise<StorageData>(
          (resolve) => {
            chrome.storage.local.get(
              ['alertsEnabled', 'lastSentAlert'],
              (data) => {
                console.log('Fetched storage data:', data);
                resolve({
                  alertsEnabled: data.alertsEnabled || false,
                  lastSentAlert: data.lastSentAlert || null
                });
              }
            );
          }
        );

        if (!alertsEnabled) {
          console.log('Alerts are disabled. Skipping notification.');
          return;
        }

        if (isEqual(lastSentAlert, popupMessage)) {
          console.log('Identical alert, no alert needed');
          return;
        }

        chrome.storage.local.set({ lastSentAlert: popupMessage }, () => {
          console.log('Updated lastSentAlert in storage:', popupMessage);
        });

        chrome.notifications.create(
          'flood-alert',
          {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('public/32.png'),
            title: 'Flood Alert!',
            message: `Flood warning: ${result.floodedPolygonData?.riverOrSea || ''}`,
            priority: 2,
            requireInteraction: true
          },
          (notificationId) => {
            if (chrome.runtime.lastError) {
              console.error(
                'Notification error:',
                chrome.runtime.lastError.message
              );
            } else {
              console.log('Notification created with ID:', notificationId);
            }
          }
        );
      } else {
        console.log('No flooding detected.');
        chrome.storage.local.remove('lastSentAlert');
      }
    } catch (error) {
      console.error('Error while checking flood status:', error);
    }
  });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.alertsEnabled) {
    const isEnabled = changes.alertsEnabled.newValue;
    console.log(`Alerts enabled: ${isEnabled}`);

    if (isEnabled) {
      chrome.alarms.create('checkFloods', { periodInMinutes: 60 });
      console.log('Flood check alarm created');
    } else {
      chrome.alarms.clear('checkFloods');
      console.log('Flood check alarm cleared');
    }
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkFloods') {
    console.log('Alarm triggered: Checking flood status');

    const alertsEnabled = await new Promise((resolve) => {
      chrome.storage.local.get('alertsEnabled', (result) => {
        resolve(result.alertsEnabled || false);
      });
    });

    if (!alertsEnabled) {
      console.log('Alerts are disabled. Skipping flood status check.');
      return;
    }

    await checkIfUserIsFlooded();
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('extension installed or updated, checking flood status...');

  checkIfUserIsFlooded();
  await storeFloodWarnings();

  chrome.storage.local.set({ isFirstRun: false });
});

//TODO remove below if everything runs well
// chrome.runtime.onStartup.addListener(() => {
//   console.log('chrome has started, checking if user is flooded...');
//   checkIfUserIsFlooded();
// });

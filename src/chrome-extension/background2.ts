import { fetchFloodWarnings } from './api/testApi';
// import fetchFloodData from './api/ukFloodAPI';
import { getAndLogFloodData, isUserFlooded } from './services/FloodDataService';

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

chrome.alarms.create('checkFloods', { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkFloods') {
    await storeFloodWarnings();
  }
});

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

// function checkIfUserIsFlooded() {
//   console.log('checkIfUserIsFlooded invoked');
//   getAndLogFloodData((floodData) => {
//     console.log('IS USER FLOODED:', isUserFlooded(floodData));
//   });
// }

// async function checkIfUserIsFlooded() {
//   console.log('checkIfUserIsFlooded invoked');

//   getAndLogFloodData(async (floodData) => {
//     try {
//       const result = await isUserFlooded(floodData);
//       console.log('IS USER FLOODED:', result);

//       if (result?.isFlooded) {
//         console.log('Flood alert:', result.floodedPolygonData);
//         // Perform actions like notifications or UI updates
//         const popupMessage = {
//           severityLevel: result.floodedPolygonData?.severityLevel
//         };

//         console.log('Sending message to popup:', popupMessage);

//         chrome.runtime.sendMessage({
//           type: 'update_popup',
//           data: popupMessage
//         });
//       } else {
//         console.log('No flooding detected.');
//       }
//     } catch (error) {
//       console.error('Error while checking flood status:', error);
//     }
//   });
// }

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

        // Store the popup message in chrome.storage
        chrome.storage.local.set({ lastFloodAlert: popupMessage });

        console.log('popup message to be shown:', popupMessage);
        // await showFloodAlert(popupMessage);

        if (result?.isFlooded) {
          console.log('Flood detected:', result.floodedPolygonData);

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
              console.log('Notification created with ID:', notificationId);
            }
          );
        }
      } else {
        console.log('No flooding detected.');
      }
    } catch (error) {
      console.error('Error while checking flood status:', error);
    }
  });
}

// async function showFloodAlert(popupMessage: {
//   severityLevel: string;
//   description: string;
//   severity: string;
// }) {
//   return new Promise<void>((resolve, reject) => {
//     chrome.notifications.create(
//       'flood-alert',
//       {
//         type: 'basic',
//         iconUrl: chrome.runtime.getURL('public/32.png'), // Ensure the path is correct
//         title: 'Flood Alert!',
//         message: `Flood warning: ${popupMessage.description}`,
//         priority: 2
//       },
//       (notificationId) => {
//         if (chrome.runtime.lastError) {
//           console.error(
//             'Notification error:',
//             chrome.runtime.lastError.message
//           );
//           reject(chrome.runtime.lastError.message);
//         } else {
//           console.log('Notification created with ID:', notificationId);
//           resolve();
//         }
//       }
//     );
//   });
// }

// Set up periodic checks
chrome.alarms.create('checkFloods', { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkFloods') {
    console.log('Alarm triggered: Checking flood status');
    await checkIfUserIsFlooded();
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'flood-alert') {
    chrome.runtime.openOptionsPage(); // Redirect user to popup or alert page
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('extension installed or updated, checking flood status...');

  checkIfUserIsFlooded();
  await storeFloodWarnings();

  chrome.storage.local.set({ isFirstRun: false });
});

chrome.runtime.onStartup.addListener(() => {
  console.log('chrome has started, checking if user is flooded...');
  checkIfUserIsFlooded();
});

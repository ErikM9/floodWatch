import { fetchFloodWarnings } from './api/testApi';
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
      resolve((request.result)?.data || []);
    };
  });
}

async function storeFloodWarnings(): Promise<void> {
  try {
    const floodWarnings = await fetchFloodWarnings();
    console.log('flood warnings:', floodWarnings);

    const storedFloodData = await getFloodWarningsFromDB();
    console.log('stored flood data from indexedDB:', storedFloodData);

    const isDataChanged = JSON.stringify(floodWarnings) !== JSON.stringify(storedFloodData);

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
    checkIfUserIsFlooded()
  }
})

chrome.runtime.onStartup.addListener(() => {
  console.log("chrome has started, checking if it's the first run...");

  chrome.storage.local.get('isFirstRun', async (result) => {
    if (!result.isFirstRun) {

      console.log('This is the first time Chrome is opened, triggering storeFloodWarnings...');

      await storeFloodWarnings();

      chrome.storage.local.set({ isFirstRun: true });
    } else {
      console.log('Not the first time, skipping storeFloodWarnings.');
    }
  });
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log("extension installed or updated, checking flood status...");

  checkIfUserIsFlooded();
  await storeFloodWarnings();

  chrome.storage.local.set({ isFirstRun: false });
});


function checkIfUserIsFlooded() {
  console.log('checkIfUserIsFlooded invoked');
  getAndLogFloodData((floodData) => {
    isUserFlooded(floodData);
  });
}

chrome.runtime.onStartup.addListener(() => {
  console.log("chrome has started, checking if user is flooded...");
  checkIfUserIsFlooded();
});


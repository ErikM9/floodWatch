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

storeFloodWarnings();

function checkIfUserIsFlooded() {
  getAndLogFloodData((floodData) => {
    isUserFlooded(floodData);
  });
}

checkIfUserIsFlooded()

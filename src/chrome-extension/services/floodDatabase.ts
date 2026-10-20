import { FloodWarning } from '@/types/types';

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
      }
    };
  });
}

export async function storeFloodWarningsInDB(
  data: FloodWarning[],
): Promise<void> {
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
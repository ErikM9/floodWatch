
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

openDatabase()


// async function storeFloodWarningsInDB(data: any): Promise<void> {
//   const db = await openDatabase();
//   const transaction = db.transaction(['floodData'], 'readwrite');
//   const objectStore = transaction.objectStore('floodData');
//   objectStore.put({ id: 'floodData', data });

//   return new Promise((resolve, reject) => {
//     transaction.oncomplete = () => resolve();
//     transaction.onerror = () => reject((event?.target as IDBRequest).error);
//   });
// }





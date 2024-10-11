
export function getAndLogFloodData(callback: (floodData: any[]) => void): void {
  chrome.storage.local.get('floodData', (result) => {
    const floodData = result.floodData || [];
    console.log('Retrieved flood data from chrome storage:', floodData);
    callback(floodData);
  });
}

export function logPolygonsFromFloodWarnings() {
  getAndLogFloodData((floodData) => {
    console.log('flood warnings from service', floodData);

  });
}







// import { fetchFloodWarnings } from './api/testApi'; // Adjust the path if necessary
// // Function to fetch and log polygons from flood warnings

// async function logPolygonsFromFloodWarnings() {
//   try {
//     const floodWarnings = await fetchFloodWarnings(); // Fetch flood warnings and polygon data
//     console.log('Flood Warnings with Polygons:', floodWarnings);

//     // Log the polygon coordinates
//     floodWarnings.forEach(flood => {
//       if (flood.polygonData) {
//         console.log(`Polygon coordinates for area ${flood.county}:`, flood.polygonData);
//         flood.polygonData.forEach((polygon: any) => {
//           console.log('the coordinates of the polygon in the background', polygon.coordinates)
//         })
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching and logging polygons:', error);
//   }
// }

// // Trigger the function to log polygons
// logPolygonsFromFloodWarnings();
// import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
// import { point } from '@turf/helpers';


// type PolygonCoordinates = number[][][];
// type MultiPolygonCoordinates = number[][][][];

// //TODO better handle the remaining info below

// type FloodDataFromAPI = {
//   area?: string;
//   coordinates: PolygonCoordinates | MultiPolygonCoordinates;
//   description?: string;
//   riverOrSea?: string;
//   severity?: string;
//   severityLevel?: number;
//   timeMessageChanged?: string;
// };

// type PolygonData = {
//   area: string;
//   description: string;
//   geometry: {
//     type: string;
//     coordinates: PolygonCoordinates | MultiPolygonCoordinates;
//   };
// };

// type FloodWithAPIData = {
//   floodDataFromAPI: FloodDataFromAPI[];
// }


// type FloodWithPolygonData = {
//   polygonData: PolygonData[];
// };

// let listenerAdded = false;

// export function getAndLogFloodData(callback: (floodData: any[]) => void): void {
//   chrome.storage.local.get('floodData', (result) => {
//     const floodData = result.floodData || [];
//     console.log('floodData from service:', floodData)
//     callback(floodData);
//   });

//   if (!listenerAdded) {

//     chrome.storage.onChanged.addListener((changes, area) => {
//       if (area === 'local' && changes.floodData) {
//         const updatedFloodData = changes.floodData.newValue || [];
//         console.log('updated flood data detected in service:', updatedFloodData);

//         callback(updatedFloodData);
//       }
//     });
//     listenerAdded = true;
//   }
// }

// export function logPolygonsFromFloodWarnings(): Promise<any[]> {
//   const allFloodData: any[] = [];

//   return new Promise((resolve) => {

//     getAndLogFloodData((floodData) => {
//       allFloodData.length = 0;
//       floodData.forEach((flood) => {
//         const {
//           id,
//           description,
//           county,
//           severity,
//           severityLevel,
//           message,
//           polygonData,
//           riverOrSea,
//           timeMessageChanged,
//         } = flood;

//         allFloodData.push({
//           id,
//           description,
//           county,
//           severity,
//           severityLevel,
//           message,
//           polygonData,
//           riverOrSea,
//           timeMessageChanged,
//         });

//       });

//       resolve(allFloodData);
//     });
//   });
// }

// export const formatPolygonData = async () => {

//   const floodData: FloodWithPolygonData[] = await logPolygonsFromFloodWarnings();
//   console.log('Flood data from check if user is flooded:', floodData);


//   const geometries = floodData.flatMap((flood) =>
//     flood.polygonData.map((data) => {
//       console.log("geometry from service:", data.geometry);
//       return data.geometry;
//     })
//   );

//   console.log('returned geometry:', geometries)
//   return geometries;

// }


// // export const isUserFlooded = async () => {
// //   const result = await chrome.storage.local.get(['userLocation']);
// //   const savedLocation = result.userLocation;

// //   if (!savedLocation || savedLocation.length !== 2) {
// //     console.error('Invalid user location from Chrome local storage:', savedLocation);
// //     return;
// //   }

// //   const userLocation = point([savedLocation[1], savedLocation[0]]);
// //   console.log('User location in service:', userLocation);

// //   const geometries = await formatPolygonData();

// //   const floodData: FloodWithAPIData[] = await logPolygonsFromFloodWarnings();
// //   console.log('floodData inside iseUserFlooded:', floodData);

// //   let isFlooded = false;
// //   let floodedPolygonData: FloodDataFromAPI | null = null;

// //   for (const geometry of geometries) {
// //     if (geometry.type === 'Polygon') {

// //       const polygonCoordinates = geometry.coordinates as number[][][];

// //       if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: polygonCoordinates })) {
// //         isFlooded = true;
// //         floodedPolygonData =
// //         break;
// //       }
// //     } else if (geometry.type === 'MultiPolygon') {

// //       const multiPolygonCoordinates = geometry.coordinates as number[][][][];

// //       for (const polygon of multiPolygonCoordinates) {
// //         if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: polygon })) {
// //           isFlooded = true;
// //           break;
// //         }
// //       }
// //     }
// //     if (isFlooded) break;
// //   }


// //   if (isFlooded) {
// //     console.log('user is flooded');
// //   } else {
// //     console.log('user is safe');
// //   }
// // };

// export const isUserFlooded = async () => {
//   const result = await chrome.storage.local.get(['userLocation']);
//   const savedLocation = result.userLocation;

//   if (!savedLocation || savedLocation.length !== 2) {
//     console.error('Invalid user location from Chrome local storage:', savedLocation);
//     return;
//   }

//   const userLocation = point([savedLocation[1], savedLocation[0]]);
//   console.log('User location in service:', userLocation);

//   // const geometries = await formatPolygonData();

//   const floodData: FloodWithAPIData[] = await logPolygonsFromFloodWarnings(); // Fetch Flood Data once
//   console.log('floodData inside isUserFlooded:', floodData);

//   let isFlooded = false;
//   let floodedPolygonData: P | null = null;

//   // Loop through geometries to find if the user is inside a polygon
//   for (const flood of floodData) {
//     for (const polygonData of flood.polygonData) {
//       const geometry = polygonData.geometry;

//       if (geometry.type === 'Polygon') {
//         const polygonCoordinates = geometry.coordinates as number[][][];

//         if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: polygonCoordinates })) {
//           isFlooded = true;
//           floodedPolygonData = polygonData; // Store the relevant polygon data
//           break;
//         }
//       } else if (geometry.type === 'MultiPolygon') {
//         const multiPolygonCoordinates = geometry.coordinates as number[][][][];

//         for (const polygon of multiPolygonCoordinates) {
//           if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: polygon })) {
//             isFlooded = true;
//             floodedPolygonData = polygonData; // Store the relevant polygon data
//             break;
//           }
//         }
//       }
//       if (isFlooded) break;
//     }
//     if (isFlooded) break;
//   }

//   // Print out all relevant data if the user is flooded
//   if (isFlooded && floodedPolygonData) {
//     console.log('User is flooded in the following area:');
//     console.log(`Area: ${floodedPolygonData.area}`);
//     console.log(`Description: ${floodedPolygonData.description}`);
//     console.log(`Severity: ${floodedPolygonData.geometry.type}`);
//   } else {
//     console.log('User is safe');
//   }
// };

import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { point } from '@turf/helpers';

type PolygonCoordinates = number[][][];
type MultiPolygonCoordinates = number[][][][];

// type FloodDataFromAPI = {
//   area?: string;
//   coordinates: PolygonCoordinates | MultiPolygonCoordinates;
//   description?: string;
//   riverOrSea?: string;
//   severity?: string;
//   severityLevel?: number;
//   timeMessageChanged?: string;
// };

type PolygonData = {
  area: string;
  description: string;
  geometry: {
    type: string;
    coordinates: PolygonCoordinates | MultiPolygonCoordinates;
  };
};

type FloodWithPolygonData = {
  polygonData: PolygonData[];
  county: string;
  description: string;
  id: string;
  message: string;
  severity: string;
  severityLevel: number;
  timeMessageChanged: string;
};

let listenerAdded = false;

export function getAndLogFloodData(callback: (floodData: any[]) => void): void {
  chrome.storage.local.get('floodData', (result) => {
    const floodData = result.floodData || [];
    console.log('floodData from service:', floodData);
    callback(floodData);
  });

  if (!listenerAdded) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.floodData) {
        const updatedFloodData = changes.floodData.newValue || [];
        console.log('updated flood data detected in service:', updatedFloodData);
        callback(updatedFloodData);
      }
    });
    listenerAdded = true;
  }
}

export function logPolygonsFromFloodWarnings(): Promise<any[]> {
  const allFloodData: any[] = [];
  console.log('allFloodData:', allFloodData)

  return new Promise((resolve) => {
    getAndLogFloodData((floodData) => {
      allFloodData.length = 0;
      // TODO make sure that floodData is an array
      console.log('floodData in service of XXXX', floodData)
      floodData.forEach((flood) => {
        const {
          id,
          description,
          county,
          severity,
          severityLevel,
          message,
          polygonData,
          riverOrSea,
          timeMessageChanged,
        } = flood;

        allFloodData.push({
          id,
          description,
          county,
          severity,
          severityLevel,
          message,
          polygonData,
          riverOrSea,
          timeMessageChanged,
        });
      });

      resolve(allFloodData);
    });
  });
}

export const isUserFlooded = async () => {
  const result = await chrome.storage.local.get(['userLocation']);
  const savedLocation = result.userLocation;

  if (!savedLocation || savedLocation.length !== 2) {
    console.error('invalid user location in Chrome storage:', savedLocation);
    return;
  }

  const userLocation = point([savedLocation[1], savedLocation[0]]);
  console.log('user location in service:', userLocation);

  const floodData: FloodWithPolygonData[] = await logPolygonsFromFloodWarnings();
  console.log('floodData inside isUserFlooded:', floodData);

  let isFlooded = false;
  let floodedPolygonData: FloodWithPolygonData | null = null;


  for (const flood of floodData) {
    for (const polygonData of flood.polygonData) {
      const geometry = polygonData.geometry;

      if (geometry.type === 'Polygon') {
        const polygonCoordinates = geometry.coordinates as number[][][];

        if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: polygonCoordinates })) {
          isFlooded = true;
          floodedPolygonData = flood;
          break;
        }
      } else if (geometry.type === 'MultiPolygon') {
        const multiPolygonCoordinates = geometry.coordinates as number[][][][];

        for (const polygon of multiPolygonCoordinates) {
          if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: polygon })) {
            isFlooded = true;
            floodedPolygonData = flood;
            break;
          }
        }
      }
      if (isFlooded) break;
    }
    if (isFlooded) break;
  }


  if (isFlooded && floodedPolygonData) {
    console.log('The user is flooded here:');
    console.log(`County: ${floodedPolygonData.county}`);
    console.log(`Description: ${floodedPolygonData.description}`);
    console.log(`ID: ${floodedPolygonData.id}`);
    console.log(`Message: ${floodedPolygonData.message}`);
    console.log(`Severity: ${floodedPolygonData.severity}`);
    console.log(`Severity level: ${floodedPolygonData.severityLevel}`);
    console.log(`Last update: ${floodedPolygonData.timeMessageChanged}`);
    console.log(`Polygon area: ${floodedPolygonData.polygonData[0].area}`);
    console.log(`Polygon description: ${floodedPolygonData.polygonData[0].description}`);
  } else {
    console.log('The user is safe');
  }
};

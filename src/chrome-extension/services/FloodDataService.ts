import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { point } from '@turf/helpers';


type PolygonCoordinates = number[][][];
type MultiPolygonCoordinates = number[][][][];

//TODO better handle the remaining info below

// type PolygonData = {
//   area: string;
//   coordinates: PolygonCoordinates | MultiPolygonCoordinates;
//   description: string;
//   riverOrSea: string;
//   severity: string;
//   severityLevel: number;
//   timeMessageChanged: string;
// };

type PolygonData = {
  area: string;
  description: string;
  geometry: {
    type: string;
    coordinates: PolygonCoordinates | MultiPolygonCoordinates;
  };
};


type Flood = {
  polygonData: PolygonData[];
};

let listenerAdded = false;

export function getAndLogFloodData(callback: (floodData: any[]) => void): void {
  chrome.storage.local.get('floodData', (result) => {
    const floodData = result.floodData || [];
    console.log('floodData from service:', floodData)
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

  return new Promise((resolve) => {

    getAndLogFloodData((floodData) => {
      allFloodData.length = 0;
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

        // Optionally log polygon data
        // if (polygonData) {
        //   polygonData.forEach((polygon: { coordinates: number[][][] | number[][][][] }) => {
        //     console.log('Polygon coordinates:', polygon.coordinates);
        //   });
        // }
      });

      resolve(allFloodData);
    });
  });
}



// const result = await chrome.storage.local.get(['userLocation']);
// const savedLocation = result.userLocation;
// console.log("savedLocation from services", savedLocation);

// const userLocation = turf.point([savedLocation[0], savedLocation[1]]);
// console.log('user location in service:', userLocation)




// export const checkIfUserIsFlooded = async () => {
//   console.log("checkIfUserIsFlooded called");

//   const floodData: Flood[] = await logPolygonsFromFloodWarnings();
//   console.log('floodData from check if user is flooded', floodData);

//   // Loop through each flood entry
//   floodData.forEach((flood) => {
//     console.log('flood from check if user is flooded:', flood); // This should only be printed once per flood

//     // Loop through each polygon in the flood's polygonData
//     flood.polygonData.forEach((polygonData: PolygonData) => {
//       console.log('polygonData from check if user is flooded:', polygonData);

//       // Check if it's a polygon or multipolygon and process accordingly
//       if (Array.isArray(polygonData.coordinates[0][0][0])) {
//         console.log('MultiPolygon coordinates:', polygonData.coordinates);
//       } else {
//         console.log('Polygon coordinates X:', polygonData.coordinates);
//       }
//     });
//   });
// };

export const formatPolygonData = async () => {

  const floodData: Flood[] = await logPolygonsFromFloodWarnings();
  console.log('Flood data from check if user is flooded:', floodData);


  // const geometry = floodData.forEach((flood) => {
  //   console.log('Flood from check if user is flooded:', flood);

  //   flood.polygonData.forEach((data) => {
  //     console.log("geometry from service:", data.geometry)
  //   })

  // })

  const geometries = floodData.flatMap((flood) =>
    flood.polygonData.map((data) => {
      console.log("geometry from service:", data.geometry);
      return data.geometry; // Collect geometry
    })
  );

  console.log('returned geometry:', geometries)
  return geometries;

}

// export const isUserFlooded = async () => {
//   const result = await chrome.storage.local.get(['userLocation']);
//   const savedLocation = result.userLocation;

//   if (!savedLocation || savedLocation.length !== 2) {
//     console.error('Invalid user location from Chrome local storage:', savedLocation);
//     return;
//   }

//   const userLocation = turf.point([savedLocation[1], savedLocation[0]]);
//   console.log('User location in service:', userLocation);

//   const geometries = await formatPolygonData();

//   let isInside = false;

//   // Loop through all geometries
//   for (const geometry of geometries) {
//     if (geometry.type === 'Polygon') {
//       // Check if the user is inside a Polygon using the direct import
//       if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: geometry.coordinates })) {
//         isInside = true;
//         break; // Stop checking once inside a polygon
//       }
//     } else if (geometry.type === 'MultiPolygon') {
//       // Check each polygon in the MultiPolygon
//       for (const polygon of geometry.coordinates) {
//         if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: polygon })) {
//           isInside = true;
//           break; // Stop checking once inside a polygon
//         }
//       }
//     }
//     if (isInside) break; // Stop if user is found inside any geometry
//   }

//   // Log the result
//   if (isInside) {
//     console.log('User is flooded');
//   } else {
//     console.log('User is safe');
//   }
// };

export const isUserFlooded = async () => {
  const result = await chrome.storage.local.get(['userLocation']);
  const savedLocation = result.userLocation;

  if (!savedLocation || savedLocation.length !== 2) {
    console.error('Invalid user location from Chrome local storage:', savedLocation);
    return;
  }

  const userLocation = point([savedLocation[1], savedLocation[0]]);
  console.log('User location in service:', userLocation);

  const geometries = await formatPolygonData();

  let isFlooded = false;


  for (const geometry of geometries) {
    if (geometry.type === 'Polygon') {

      const polygonCoordinates = geometry.coordinates as number[][][];

      if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: polygonCoordinates })) {
        isFlooded = true;
        break;
      }
    } else if (geometry.type === 'MultiPolygon') {

      const multiPolygonCoordinates = geometry.coordinates as number[][][][];

      for (const polygon of multiPolygonCoordinates) {
        if (booleanPointInPolygon(userLocation, { type: 'Polygon', coordinates: polygon })) {
          isFlooded = true;
          break;
        }
      }
    }
    if (isFlooded) break;
  }


  if (isFlooded) {
    console.log('user is flooded');
  } else {
    console.log('user is safe');
  }
};

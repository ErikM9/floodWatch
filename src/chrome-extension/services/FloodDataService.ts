import * as turf from '@turf/turf';
// import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";


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
    coordinates: PolygonCoordinates | MultiPolygonCoordinates;
    type: string;
  };
};


type Flood = {
  polygonData: PolygonData[];
};







export function getAndLogFloodData(callback: (floodData: any[]) => void): void {
  chrome.storage.local.get('floodData', (result) => {
    const floodData = result.floodData || [];
    console.log('floodData from service:', floodData)
    callback(floodData);
  });
}

export function logPolygonsFromFloodWarnings(): Promise<any[]> {
  const allFloodData: any[] = [];

  return new Promise((resolve) => {
    getAndLogFloodData((floodData) => {
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

  const result = await chrome.storage.local.get(['userLocation']);
  const savedLocation = result.userLocation;


  if (!savedLocation || savedLocation.length !== 2) {
    console.error('Invalid user location from Chrome local storage:', savedLocation);
    return;
  }


  const userLocation = turf.point([savedLocation[1], savedLocation[0]]);
  console.log('User location in service:', userLocation);

  console.log("checkIfUserIsFlooded called");


  const floodData: Flood[] = await logPolygonsFromFloodWarnings();
  console.log('Flood data from check if user is flooded:', floodData);


  floodData.forEach((flood) => {
    console.log('Flood from check if user is flooded:', flood);

    flood.polygonData.forEach((geometry) => {
      console.log("geometry from service:", geometry.geometry)
    })

  })
  // return geometry.geometry but rename it first
}


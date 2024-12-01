// WHEN WORKING WITH THE API

import axios from 'axios';

import {
  ApiFloodWarning,
  ApiPolygonData,
  FloodResponse,
  PolygonResponse,
} from '@/types/api';

// URL for the floods and polygons API endpoints
const floodAPI = 'https://environment.data.gov.uk/flood-monitoring/id/floods';
// const floodAPI = 'http://localhost:3000/items';
console.log('flood API', floodAPI);
const polygonAPIBase =
  'https://environment.data.gov.uk/flood-monitoring/id/floodAreas';
// const polygonAPIBase = 'http://localhost:3000/floodAreas';

export async function fetchFloodWarnings(): Promise<ApiFloodWarning[]> {
  try {
    const response = await axios.get<FloodResponse>(floodAPI);
    console.log('response from API', response);
    const floods = response.data.items;
    const floodWarnings: ApiFloodWarning[] = [];
    console.log('flood warnings from the API', floodWarnings);
    for (const flood of floods) {
      const floodDetails: ApiFloodWarning = {
        id: flood.floodAreaID,
        description: flood.description,
        county: flood.floodArea.county,
        riverOrSea: flood.floodArea.riverOrSea,
        severity: flood.severity,
        severityLevel: flood.severityLevel,
        message: flood.message,
        timeMessageChanged: flood.timeMessageChanged,
        polygonData: (await fetchPolygonData(flood.floodAreaID)) || [],
      };
      floodWarnings.push(floodDetails);
    }

    return floodWarnings;
  } catch (error) {
    console.error('Error fetching flood warnings:', error);
    return [];
  }
}

export async function fetchPolygonData(
  floodAreaID: string,
): Promise<ApiPolygonData[]> {
  const polygonEndpoint = `${polygonAPIBase}/${floodAreaID}/polygon`;

  try {
    const response = await axios.get<PolygonResponse>(polygonEndpoint);
    const polygonData = response.data;
    console.log('polygon end point:', polygonData);
    return extractCoordinates(polygonData);
  } catch (error) {
    console.error(
      `Error fetching polygon for flood area ${floodAreaID}:`,
      error,
    );
    return [];
  }
}

export function extractCoordinates(
  polygonData: PolygonResponse,
): ApiPolygonData[] {
  return polygonData.features.map((feature) => {
    const geometryType = feature.geometry.type;

    if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
      throw new Error(`Unexpected geometry type: ${geometryType}`);
    }

    return {
      area: feature.properties.AREA,
      description: feature.properties.DESCRIP,
      geometry: {
        type: geometryType,
        coordinates: feature.geometry.coordinates,
      },
    };
  });
}

// FOR MOCK DATA
// import { floodResponse, polygonResponse } from '../../data/floodMockData';
// import { PolygonResponse, PolygonFeature } from '../../data/types';

// if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
//   console.log('Using mock data');
// }

// interface FloodDetails {
//   id: string;
//   description: string;
//   county: string;
//   riverOrSea: string;
//   severity: string;
//   severityLevel: number;
//   message: string;
//   timeMessageChanged: string;
//   polygonData: {
//     area: string;
//     description: string;
//     geometry: {
//       type: string;
//       coordinates: number[][][] | number[][][][];
//     };
//   }[];
//   geometry: {
//     type: string;
//     coordinates: number[][][] | number[][][][];
//   } | null;
// }

// // Function to extract flood warning details using mock data
// export async function fetchFloodWarnings(): Promise<FloodDetails[]> {
//   try {
//     const floods = floodResponse.items; // Use mock flood data
//     const floodWarnings: FloodDetails[] = [];

//     for (const flood of floods) {
//       const polygonData = fetchPolygonData(flood.floodAreaID); // Get polygon data
//       const floodDetails: FloodDetails = {
//         id: flood.floodAreaID,
//         description: flood.description,
//         county: flood.floodArea.county,
//         riverOrSea: flood.floodArea.riverOrSea,
//         severity: flood.severity,
//         severityLevel: flood.severityLevel,
//         message: flood.message,
//         timeMessageChanged: flood.timeMessageChanged,
//         polygonData, // Full polygonData array
//         geometry: polygonData?.[0]?.geometry || null // First geometry for easier access
//       };
//       floodWarnings.push(floodDetails);
//     }

//     return floodWarnings;
//   } catch (error) {
//     console.error('Error fetching flood warnings:', error);
//     return [];
//   }
// }

// // Function to fetch polygon data using mock data
// export function fetchPolygonData(floodAreaID: string): {
//   area: string;
//   description: string;
//   geometry: {
//     type: string;
//     coordinates: number[][][] | number[][][][];
//   };
// }[] {
//   // Filter features based on the floodAreaID
//   const polygons = polygonResponse.features.filter(
//     (feature: PolygonFeature) => feature.properties.FWS_TACODE === floodAreaID
//   );

//   // Extract relevant data
//   return polygons.map((feature: PolygonFeature) => ({
//     area: feature.properties.AREA,
//     description: feature.properties.DESCRIP,
//     geometry: {
//       type: feature.geometry.type,
//       coordinates: feature.geometry.coordinates
//     }
//   }));
// }

// // Function to extract coordinates from polygon data
// export function extractCoordinates(polygonData: PolygonResponse): {
//   area: string;
//   description: string;
//   geometry: {
//     type: string;
//     coordinates: number[][][] | number[][][][];
//   };
// }[] {
//   return polygonData.features.map((feature: PolygonFeature) => ({
//     area: feature.properties.AREA,
//     description: feature.properties.DESCRIP,
//     geometry: {
//       type: feature.geometry.type,
//       coordinates: feature.geometry.coordinates
//     }
//   }));
// }

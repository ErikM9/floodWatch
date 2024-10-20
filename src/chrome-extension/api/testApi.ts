import axios from 'axios';

// Type definitions for flood warnings and polygon data
interface FloodArea {
  '@id': string;
  county: string;
  notation: string;
  polygon: string;
  riverOrSea: string;
}

interface FloodItem {
  '@id': string;
  description: string;
  eaAreaName: string;
  eaRegionName: string;
  floodArea: FloodArea;
  floodAreaID: string;
  isTidal: boolean;
  message: string;
  severity: string;
  severityLevel: number;
  timeMessageChanged: string;
  timeRaised: string;
}

interface FloodResponse {
  '@context': string;
  meta: {
    publisher: string;
    licence: string;
    documentation: string;
    version: string;
    comment: string;
    hasFormat: string[];
  };
  items: FloodItem[];
}

interface PolygonFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    AREA: string;
    FWS_TACODE: string;
    TA_NAME: string;
    DESCRIP: string;
    LA_NAME: string;
    PARENT: string;
    QDIAL: string;
    RIVER_SEA: string;
  };
}

interface PolygonResponse {
  type: string;
  features: PolygonFeature[];
}

// URL for the floods and polygons API endpoints
const floodAPI = 'https://environment.data.gov.uk/flood-monitoring/id/floods';
// const floodAPI = 'http://localhost:3000/items';
console.log('flood API', floodAPI);
const polygonAPIBase =
  'https://environment.data.gov.uk/flood-monitoring/id/floodAreas';
// const polygonAPIBase = 'http://localhost:3000/floodAreas';

// Function to extract the flood warning details
export async function fetchFloodWarnings(): Promise<any[]> {
  try {
    const response = await axios.get<FloodResponse>(floodAPI);
    console.log('response from API', response);
    const floods = response.data.items;
    const floodWarnings: any[] = [];
    console.log('flood warnings from the API', floodWarnings);
    for (const flood of floods) {
      const floodDetails = {
        id: flood.floodAreaID,
        description: flood.description,
        county: flood.floodArea.county,
        riverOrSea: flood.floodArea.riverOrSea,
        severity: flood.severity,
        severityLevel: flood.severityLevel,
        message: flood.message,
        timeMessageChanged: flood.timeMessageChanged,
        polygonData: await fetchPolygonData(flood.floodAreaID) // Fetch polygon data dynamically
      };
      floodWarnings.push(floodDetails);
    }

    return floodWarnings;
  } catch (error) {
    console.error('Error fetching flood warnings:', error);
    return [];
  }
}

// Function to fetch polygon data (handles both Polygon and MultiPolygon)
export async function fetchPolygonData(floodAreaID: string): Promise<any> {
  const polygonEndpoint = `${polygonAPIBase}/${floodAreaID}/polygon`;

  try {
    const response = await axios.get<PolygonResponse>(polygonEndpoint);
    const polygonData = response.data;
    // console.log("polygon end point:", polygonData)
    return extractCoordinates(polygonData);
  } catch (error) {
    console.error(
      `Error fetching polygon for flood area ${floodAreaID}:`,
      error
    );
    return null;
  }
}

// Function to extract and handle both Polygon and MultiPolygon geometries
export function extractCoordinates(polygonData: PolygonResponse): any[] {
  const features = polygonData.features;

  // Iterate through the features and handle each one
  const polygons = features.map((feature) => {
    const geometryType = feature.geometry.type;

    return {
      area: feature.properties.AREA,
      description: feature.properties.DESCRIP,
      geometry: {
        type: geometryType,
        coordinates: feature.geometry.coordinates
      }
    };
  });

  return polygons;
}

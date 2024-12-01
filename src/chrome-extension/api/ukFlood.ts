import axios from 'axios';

import {
  ApiFloodWarning,
  ApiPolygonData,
  FloodResponse,
  PolygonResponse,
} from '@/types/api';

const floodAPI = 'https://environment.data.gov.uk/flood-monitoring/id/floods';

console.log('flood API', floodAPI);
const polygonAPIBase =
  'https://environment.data.gov.uk/flood-monitoring/id/floodAreas';

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

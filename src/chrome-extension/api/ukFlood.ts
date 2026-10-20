import { MultiPolygon, Polygon } from 'geojson';

import { FloodResponse, PolygonResponse } from '@/types/api';
import { FloodWarning, PolygonData } from '@/types/types';

const floodAPI = 'https://environment.data.gov.uk/flood-monitoring/id/floods';
const polygonAPIBase =
  'https://environment.data.gov.uk/flood-monitoring/id/floodAreas';

/* Reuses the polygons already held for an area, since a flood area keeps its shape while its warning changes */
export async function fetchFloodWarnings(
  knownWarnings: FloodWarning[],
): Promise<FloodWarning[]> {
  const response = await fetch(floodAPI);

  if (!response.ok) {
    throw new Error(`Could not fetch flood warnings: ${response.status}`);
  }

  const { items }: FloodResponse = await response.json();
  const knownPolygons = new Map(
    knownWarnings.map((warning) => [warning.id, warning.polygonData]),
  );
  const floodWarnings: FloodWarning[] = [];

  for (const flood of items) {
    const polygonData = knownPolygons.get(flood.floodAreaID);

    floodWarnings.push({
      id: flood.floodAreaID,
      description: flood.description,
      county: flood.floodArea.county,
      riverOrSea: flood.floodArea.riverOrSea,
      severity: flood.severity,
      severityLevel: flood.severityLevel,
      message: flood.message,
      timeMessageChanged: flood.timeMessageChanged,
      polygonData: polygonData?.length
        ? polygonData
        : await fetchPolygonData(flood.floodAreaID),
    });
  }

  return floodWarnings;
}

async function fetchPolygonData(floodAreaID: string): Promise<PolygonData[]> {
  try {
    const response = await fetch(`${polygonAPIBase}/${floodAreaID}/polygon`);

    if (!response.ok) {
      throw new Error(`Could not fetch the polygon: ${response.status}`);
    }

    return extractCoordinates(await response.json());
  } catch (error) {
    console.error(
      `Error fetching polygon for flood area ${floodAreaID}:`,
      error,
    );
    return [];
  }
}

/* Keeps the polygons of an outline and leaves out any other kind of shape */
function extractCoordinates(polygonData: PolygonResponse): PolygonData[] {
  return polygonData.features
    .filter(
      (feature) =>
        feature.geometry.type === 'Polygon' ||
        feature.geometry.type === 'MultiPolygon',
    )
    .map((feature) => ({
      area: feature.properties.AREA,
      description: feature.properties.DESCRIP,
      geometry: feature.geometry as Polygon | MultiPolygon,
    }));
}
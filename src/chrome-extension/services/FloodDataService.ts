import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { Feature, FeatureCollection } from 'geojson';

import { FloodWarning } from '@/types/types';

/* Picks the gravest warning covering the location, as lower levels are more severe and level 4 marks a lifted warning */
export function findUserFlood(
  floodData: FloodWarning[],
  location: [number, number],
): FloodWarning | null {
  const userLocation = point([location[1], location[0]]);

  return floodData
    .filter((flood) =>
      flood.polygonData.some((polygonData) =>
        booleanPointInPolygon(userLocation, polygonData.geometry),
      ),
    )
    .reduce<FloodWarning | null>(
      (gravest, flood) =>
        !gravest || flood.severityLevel < gravest.severityLevel
          ? flood
          : gravest,
      null,
    );
}

/* Orders the more severe areas last, so they are drawn on top where areas overlap */
export function toMapFeatures(floodData: FloodWarning[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [...floodData]
      .sort((first, second) => second.severityLevel - first.severityLevel)
      .flatMap((flood) =>
        flood.polygonData.map(
          (polygonData): Feature => ({
            type: 'Feature',
            properties: { severityLevel: flood.severityLevel },
            geometry: polygonData.geometry,
          }),
        ),
      ),
  };
}
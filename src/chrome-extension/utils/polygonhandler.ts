import { PolygonData, GeoJSONFeatureCollection } from '@/types/polygonHandler';

export function handlePolygonData(polygonData: PolygonData): Array<{
  coordinates: number[][][] | number[][][][];
  AREA: string;
  TA_NAME: string;
  DESCRIP: string;
  LA_NAME: string;
  RIVER_SEA: string;
}> {
  return polygonData.features.map((feature) => {
    const { coordinates } = feature.geometry;
    const { AREA, TA_NAME, DESCRIP, LA_NAME, RIVER_SEA } = feature.properties;

    return {
      coordinates,
      AREA,
      TA_NAME,
      DESCRIP,
      LA_NAME,
      RIVER_SEA
    };
  });
}

export function processPolygons(
  polygonData: PolygonData
): GeoJSONFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: polygonData.features.map((feature, _index) => {
      const { coordinates } = feature.geometry;

      const validCoords: number[][][] =
        feature.geometry.type === 'MultiPolygon'
          ? (coordinates as number[][][][]).flat()
          : (coordinates as number[][][]);

      return {
        type: 'Feature',
        geometry: {
          type: feature.geometry.type,
          coordinates: validCoords
        },
        properties: {
          AREA: feature.properties.AREA,
          TA_NAME: feature.properties.TA_NAME,
          DESCRIP: feature.properties.DESCRIP,
          LA_NAME: feature.properties.LA_NAME,
          RIVER_SEA: feature.properties.RIVER_SEA
        }
      };
    })
  };
}

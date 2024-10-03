interface PolygonData {
  type: string;
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: number[][][][];
    };
    properties: {
      AREA: string;
      FWS_TACODE: string;
      TA_NAME: string;
      DESCRIP: string;
      LA_NAME: string;
      QDIAL: string;
      RIVER_SEA: string;
    };
  }>;
}

export function handlePolygonData(polygonData: PolygonData) {
  return polygonData.features.map(feature => {
    const { coordinates } = feature.geometry;
    const { AREA, TA_NAME, DESCRIP, LA_NAME, RIVER_SEA } = feature.properties;

    return {
      coordinates,
      AREA,
      TA_NAME,
      DESCRIP,
      LA_NAME,
      RIVER_SEA
    }
  })
}
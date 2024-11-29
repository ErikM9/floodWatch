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

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: {
    AREA: string;
    TA_NAME: string;
    DESCRIP: string;
    LA_NAME: string;
    RIVER_SEA: string;
  };
}

export function handlePolygonData(polygonData: PolygonData) {
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

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export function processPolygons(polygonData: any): GeoJSONFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: polygonData.map((polygon: any, polygonIndex: number) => {
      return {
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: polygon.map((p: any, pIndex: number) => {
            if (!p.coordinates) {
              console.error(
                `Missing coordinates in p ${pIndex} of polygon ${polygonIndex}`
              );
              return [];
            }

            const validCoords = p.coordinates.map((coordSet: any) => {
              const coords = Array.isArray(coordSet[0])
                ? coordSet[0]
                : coordSet;

              return coords.filter((point: any) => {
                return (
                  Array.isArray(point) &&
                  point.length === 2 &&
                  !isNaN(point[0]) &&
                  !isNaN(point[1])
                );
              });
            });

            return validCoords;
          })
        },
        properties: {
          AREA: polygon[0]?.AREA || '',
          TA_NAME: polygon[0]?.TA_NAME || '',
          DESCRIP: polygon[0]?.DESCRIP || '',
          LA_NAME: polygon[0]?.LA_NAME || '',
          RIVER_SEA: polygon[0]?.RIVER_SEA || ''
        }
      };
    })
  };
}

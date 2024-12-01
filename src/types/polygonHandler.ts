export interface PolygonData {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: number[][][] | number[][][][];
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

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
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

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

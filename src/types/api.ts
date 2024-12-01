export interface FloodArea {
  '@id': string;
  county: string;
  notation: string;
  polygon: string;
  riverOrSea: string;
}

export interface FloodItem {
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

export interface FloodResponse {
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

export interface PolygonFeature {
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

export interface PolygonResponse {
  type: string;
  features: PolygonFeature[];
}

export interface ApiFloodWarning {
  id: string;
  description: string;
  county: string;
  riverOrSea: string;
  severity: string;
  severityLevel: number;
  message: string;
  timeMessageChanged: string;
  polygonData: ApiPolygonData[];
}

export interface ApiPolygonData {
  area: string;
  description: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface ApiFloodResponse {
  items: {
    floodAreaID: string;
    description: string;
    floodArea: {
      county: string;
      riverOrSea: string;
    };
    severity: string;
    severityLevel: number;
    message: string;
    timeMessageChanged: string;
  }[];
}

export interface ApiPolygonResponse {
  features: {
    properties: {
      AREA: string;
      DESCRIP: string;
    };
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: number[][][] | number[][][][];
    };
  }[];
}

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

export interface FloodWarning {
  id: string;
  description: string;
  county: string;
  riverOrSea: string;
  severity: string;
  severityLevel: number;
  message: string;
  timeMessageChanged: string;
  polygonData: Polygon[];
}

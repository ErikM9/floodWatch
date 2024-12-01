export interface LastSentAlert {
  id: string;
  severityLevel?: string;
  severity?: string;
  description?: string;
  message?: string;
  riverOrSea?: string;
  county?: string;
  timeMessageChanged?: string;
}

export interface StorageData {
  alertsEnabled?: boolean;
  lastSentAlert?: LastSentAlert;
}

interface PolygonData {
  area: string;
  description: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface FloodWarning {
  id: string;
  description: string;
  county: string;
  severity: string;
  severityLevel: number;
  message: string;
  riverOrSea: string;
  timeMessageChanged: string;
  polygonData: PolygonData[];
}

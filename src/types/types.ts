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

export interface FloodWarning {
  id: string;
  severity: string;
  severityLevel: number;
  description: string;
  message: string;
  riverOrSea: string;
  county: string;
  timeMessageChanged: string;
  polygonData: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

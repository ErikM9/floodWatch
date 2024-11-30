interface PolygonData {
  area: string;
  description: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface FloodWithPolygonData {
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

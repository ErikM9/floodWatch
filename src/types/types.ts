import { MultiPolygon, Polygon } from 'geojson';

export interface PolygonData {
  area: string;
  description: string;
  geometry: Polygon | MultiPolygon;
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

export type AlertMessage = Omit<FloodWarning, 'polygonData'>;
import { MultiPolygon, Polygon } from 'geojson';

import { FloodItem, FloodResponse, PolygonResponse } from '@/types/api';

export const FLOODS_URL =
  'https://environment.data.gov.uk/flood-monitoring/id/floods';
export const FLOOD_AREAS_URL =
  'https://environment.data.gov.uk/flood-monitoring/id/floodAreas';
const LINKED_DATA_ID = 'http://environment.data.gov.uk/flood-monitoring/id';

export interface FloodAreaFixture {
  id: string;
  description: string;
  county: string;
  riverOrSea: string;
  eaAreaName: string;
  geometry: Polygon | MultiPolygon;
}

const rectangle = (
  west: number,
  south: number,
  east: number,
  north: number,
): number[][] => [
  [west, south],
  [east, south],
  [east, north],
  [west, north],
  [west, south],
];

/* A wide alert area over York, given as a multipolygon with a single part */
export const ouseAlertArea: FloodAreaFixture = {
  id: '122WAF946',
  description: 'River Ouse catchment in York',
  county: 'York, North Yorkshire',
  riverOrSea: 'River Ouse',
  eaAreaName: 'Yorkshire',
  geometry: {
    type: 'MultiPolygon',
    coordinates: [[rectangle(-1.2, 53.9, -0.95, 54.02)]],
  },
};

/* A warning area in two parts, the second holding York's city centre inside the alert area */
export const fossWarningArea: FloodAreaFixture = {
  id: '122FWF738',
  description: 'River Foss at York city centre',
  county: 'York',
  riverOrSea: 'River Foss',
  eaAreaName: 'Yorkshire',
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [rectangle(-1.0, 53.5, -0.9, 53.6)],
      [rectangle(-1.1, 53.95, -1.06, 53.97)],
    ],
  },
};

/* A single polygon around Tewkesbury with a hole cut out for an island in the river */
export const severnAlertArea: FloodAreaFixture = {
  id: '031WAF110',
  description: 'River Severn at Tewkesbury',
  county: 'Gloucestershire',
  riverOrSea: 'River Severn',
  eaAreaName: 'West Midlands',
  geometry: {
    type: 'Polygon',
    coordinates: [
      rectangle(-2.2, 51.95, -2.1, 52.03),
      rectangle(-2.13, 51.96, -2.11, 51.97),
    ],
  },
};

const floodAreas = [ouseAlertArea, fossWarningArea, severnAlertArea];

export const locations = {
  yorkCityCentre: [53.9590555, -1.0815361] as [number, number],
  tewkesbury: [51.9925, -2.1601] as [number, number],
  severnIsland: [51.965, -2.12] as [number, number],
  leeds: [53.7974185, -1.5437941] as [number, number],
};

const severities = {
  1: 'Severe flood warning',
  2: 'Flood warning',
  3: 'Flood alert',
  4: 'Warning no longer in force',
};

export function floodItem(
  area: FloodAreaFixture,
  severityLevel: 1 | 2 | 3 | 4,
  message = 'River levels are rising and flooding of low-lying land is possible.',
): FloodItem {
  return {
    '@id': `${LINKED_DATA_ID}/floods/${area.id}`,
    description: area.description,
    eaAreaName: area.eaAreaName,
    eaRegionName: 'No longer used',
    floodArea: {
      '@id': `${LINKED_DATA_ID}/floodAreas/${area.id}`,
      county: area.county,
      notation: area.id,
      polygon: `${LINKED_DATA_ID}/floodAreas/${area.id}/polygon`,
      riverOrSea: area.riverOrSea,
    },
    floodAreaID: area.id,
    isTidal: false,
    message,
    severity: severities[severityLevel],
    severityLevel,
    timeMessageChanged: '2024-11-25T09:15:00',
    timeRaised: '2024-11-25T09:15:41',
    timeSeverityChanged: '2024-11-25T09:15:00',
  };
}

export function floodsResponse(items: FloodItem[]): FloodResponse {
  return {
    '@context':
      'http://environment.data.gov.uk/flood-monitoring/meta/context.jsonld',
    meta: {
      publisher: 'Environment Agency',
      licence:
        'http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
      documentation:
        'http://environment.data.gov.uk/flood-monitoring/doc/reference',
      version: '0.9',
      comment: 'Status: Beta service',
      hasFormat: [
        'http://environment.data.gov.uk/flood-monitoring/id/floods.csv',
        'http://environment.data.gov.uk/flood-monitoring/id/floods.rdf',
        'http://environment.data.gov.uk/flood-monitoring/id/floods.ttl',
        'http://environment.data.gov.uk/flood-monitoring/id/floods.html',
      ],
    },
    items,
  };
}

export function polygonResponse(area: FloodAreaFixture): PolygonResponse {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: area.geometry,
        properties: {
          AREA: area.eaAreaName,
          FWS_TACODE: area.id,
          TA_NAME: area.description,
          DESCRIP: area.description,
          LA_NAME: area.county,
          PARENT: area.id.replace(/FW[FC]/, 'WAF'),
          QDIAL: '210022',
          RIVER_SEA: area.riverOrSea,
        },
      },
    ],
  };
}

export const floodAreaById = (id: string) =>
  floodAreas.find((area) => area.id === id);
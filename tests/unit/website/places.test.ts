import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { MultiPolygon, Polygon } from 'geojson';
import { describe, expect, it } from 'vitest';

import { pickPlaces, pointInside } from '../../../website/src/demo/places';
import {
  FloodAreaFixture,
  fossWarningArea,
  ouseAlertArea,
  severnAlertArea,
} from '../../support/floodData';

import { findUserFlood } from '@/chrome-extension/services/FloodDataService';
import { FloodWarning } from '@/types/types';

const square = (west: number, south: number, size: number) => [
  [west, south],
  [west + size, south],
  [west + size, south + size],
  [west, south + size],
  [west, south],
];

const isInside = ([latitude, longitude]: number[], outline: Polygon) =>
  booleanPointInPolygon(point([longitude, latitude]), outline);

const anywhere = () => true;

function warning(
  area: FloodAreaFixture,
  severityLevel: number,
  description = area.description,
): FloodWarning {
  return {
    id: `${area.id}-${description}`,
    description,
    county: area.county,
    severity: ['', 'Severe flood warning', 'Flood warning', 'Flood alert'][
      severityLevel
    ],
    severityLevel,
    message: '',
    riverOrSea: area.riverOrSea,
    timeMessageChanged: '',
    polygonData: [
      { area: area.eaAreaName, description, geometry: area.geometry },
    ],
  };
}

/* An area of its own for each name, a square apart from the others */
const separateArea = (index: number): FloodAreaFixture => ({
  ...severnAlertArea,
  id: `031WAF11${index}`,
  geometry: { type: 'Polygon', coordinates: [square(index * 2, 50, 1)] },
});

describe('pointInside', () => {
  it('finds a point near the middle of an outline, outside a hole in its middle', () => {
    const outline: Polygon = {
      type: 'Polygon',
      coordinates: [square(0, 0, 10), square(4, 4, 2)],
    };

    const location = pointInside(outline, anywhere);

    expect(isInside(location!, outline)).toBe(true);
    expect(Math.hypot(location![0] - 5, location![1] - 5)).toBeLessThan(2);
  });

  it('uses the largest part of an outline in several parts', () => {
    const outline: MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [square(200, 200, 1)],
        [square(20, 20, 5)],
        [square(50, 50, 2)],
      ],
    };

    const location = pointInside(outline, anywhere);

    expect(location![0]).toBeCloseTo(22.5);
    expect(location![1]).toBeCloseTo(22.5);
  });

  it('takes the nearest point to the middle which the check accepts', () => {
    const outline: Polygon = {
      type: 'Polygon',
      coordinates: [square(0, 0, 15)],
    };

    const location = pointInside(outline, ([latitude]) => latitude > 9);

    expect(location).toEqual([9.5, 7.5]);
  });

  it('tries points across the whole outline, out to its far corner', () => {
    const outline: Polygon = {
      type: 'Polygon',
      coordinates: [square(0, 0, 15)],
    };

    const location = pointInside(
      outline,
      ([latitude, longitude]) => latitude > 14 && longitude > 14,
    );

    expect(location).toEqual([14.5, 14.5]);
  });

  it('falls back to a corner of an outline too thin for any point it tries', () => {
    const frame: Polygon = {
      type: 'Polygon',
      coordinates: [square(0, 0, 10), square(0.01, 0.01, 9.98)],
    };

    const location = pointInside(frame, anywhere);

    expect(location).toEqual([0, 0]);
    expect(isInside(location!, frame)).toBe(true);
  });

  it('finds nothing when the check accepts no point', () => {
    const outline: Polygon = {
      type: 'Polygon',
      coordinates: [square(0, 0, 10)],
    };

    const location = pointInside(outline, () => false);

    expect(location).toBeNull();
  });
});

describe('pickPlaces', () => {
  it('offers the gravest warnings in force first, then in alphabetical order, up to three', () => {
    const places = pickPlaces([
      warning(separateArea(1), 3, 'River Ure at Ripon'),
      warning(separateArea(2), 3, 'River Avon at Evesham'),
      warning(separateArea(3), 2, 'River Foss at York city centre'),
      warning(separateArea(4), 3, 'River Leadon at Ledbury'),
    ]);

    expect(places.map(({ description }) => description)).toEqual([
      'River Foss at York city centre',
      'River Avon at Evesham',
      'River Leadon at Ledbury',
    ]);
    expect(places[0]).toMatchObject({
      severity: 'Flood warning',
      severityLevel: 2,
    });
  });

  it('leaves out warnings no longer in force and those without an outline', () => {
    const withoutOutline = {
      ...warning(ouseAlertArea, 1, 'River Wharfe at Otley'),
      polygonData: [],
    };

    const places = pickPlaces([
      warning(severnAlertArea, 4),
      withoutOutline,
      warning(fossWarningArea, 2),
    ]);

    expect(places.map(({ description }) => description)).toEqual([
      'River Foss at York city centre',
    ]);
  });

  it('puts each place inside its own area, where no graver warning covers it', () => {
    const warnings = [warning(ouseAlertArea, 3), warning(fossWarningArea, 2)];

    const places = pickPlaces(warnings);

    expect(places).toHaveLength(2);
    for (const place of places) {
      expect(findUserFlood(warnings, place.location)?.id).toBe(place.id);
    }
  });

  it('leaves out a warning whose area lies wholly under a graver one, and offers the next', () => {
    const covered: FloodAreaFixture = {
      ...ouseAlertArea,
      geometry: {
        type: 'Polygon',
        coordinates: [square(-1.09, 53.952, 0.015)],
      },
    };

    const places = pickPlaces(
      [
        warning(covered, 3, 'River Ouse at Clifton'),
        warning(fossWarningArea, 2),
        warning(severnAlertArea, 3),
      ],
      2,
    );

    expect(places.map(({ description }) => description)).toEqual([
      'River Foss at York city centre',
      'River Severn at Tewkesbury',
    ]);
  });
});
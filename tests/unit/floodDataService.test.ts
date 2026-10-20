import { describe, expect, it } from 'vitest';

import {
  FloodAreaFixture,
  fossWarningArea,
  locations,
  ouseAlertArea,
  severnAlertArea,
} from '../support/floodData';

import {
  findUserFlood,
  toMapFeatures,
} from '@/chrome-extension/services/FloodDataService';
import { FloodWarning } from '@/types/types';

const warning = (
  area: FloodAreaFixture,
  severityLevel: number,
  outlines = [area.geometry],
): FloodWarning => ({
  id: area.id,
  description: area.description,
  county: area.county,
  severity: 'Flood warning',
  severityLevel,
  message: 'River levels are rising.',
  riverOrSea: area.riverOrSea,
  timeMessageChanged: '2024-11-25T09:15:00',
  polygonData: outlines.map((geometry) => ({
    area: area.eaAreaName,
    description: area.description,
    geometry,
  })),
});

describe('findUserFlood', () => {
  it('finds the warning whose area holds the location', () => {
    const severn = warning(severnAlertArea, 3);

    expect(findUserFlood([severn], locations.tewkesbury)).toBe(severn);
  });

  it('finds a location in any of the outlines of an area, whatever part of them it lies in', () => {
    const foss = warning(fossWarningArea, 2, [
      severnAlertArea.geometry,
      fossWarningArea.geometry,
    ]);

    expect(findUserFlood([foss], locations.yorkCityCentre)).toBe(foss);
  });

  it('returns nothing for a location outside every area', () => {
    const floods = [warning(ouseAlertArea, 3), warning(fossWarningArea, 2)];

    expect(findUserFlood(floods, locations.leeds)).toBeNull();
  });

  it('returns nothing for a location in a hole of an area', () => {
    const floods = [warning(severnAlertArea, 3)];

    expect(findUserFlood(floods, locations.severnIsland)).toBeNull();
  });

  it('picks the most severe of the warnings whose areas overlap at the location', () => {
    const foss = warning(fossWarningArea, 2);
    const floods = [warning(ouseAlertArea, 3), foss, warning(ouseAlertArea, 4)];

    expect(findUserFlood(floods, locations.yorkCityCentre)).toBe(foss);
  });
});

describe('toMapFeatures', () => {
  it('turns every outline into a map feature tagged with the severity of its warning', () => {
    const floods = [
      warning(severnAlertArea, 3),
      warning(fossWarningArea, 2, [
        fossWarningArea.geometry,
        ouseAlertArea.geometry,
      ]),
    ];

    expect(toMapFeatures(floods)).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { severityLevel: 3 },
          geometry: severnAlertArea.geometry,
        },
        {
          type: 'Feature',
          properties: { severityLevel: 2 },
          geometry: fossWarningArea.geometry,
        },
        {
          type: 'Feature',
          properties: { severityLevel: 2 },
          geometry: ouseAlertArea.geometry,
        },
      ],
    });
  });

  it('puts the most severe areas last, so they are drawn on top', () => {
    const floods = [
      warning(fossWarningArea, 2),
      warning(severnAlertArea, 1),
      warning(ouseAlertArea, 3),
    ];

    const levels = toMapFeatures(floods).features.map(
      (feature) => feature.properties?.severityLevel,
    );

    expect(levels).toEqual([3, 2, 1]);
  });

  it('leaves out areas that have no outline', () => {
    const floods = [warning(fossWarningArea, 2, []), warning(ouseAlertArea, 3)];

    expect(toMapFeatures(floods).features).toHaveLength(1);
  });
});
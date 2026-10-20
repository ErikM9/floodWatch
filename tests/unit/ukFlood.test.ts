import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  FLOOD_AREAS_URL,
  FLOODS_URL,
  floodItem,
  fossWarningArea,
  ouseAlertArea,
  polygonResponse,
} from '../support/floodData';
import { server, serveFloods, serviceUnavailable } from '../support/server';

import { fetchFloodWarnings } from '@/chrome-extension/api/ukFlood';

describe('fetchFloodWarnings', () => {
  it('turns each warning into one for its flood area, with the outline of the area', async () => {
    serveFloods(
      floodItem(
        fossWarningArea,
        2,
        'Flooding is expected on Foss Islands Road.',
      ),
    );

    const warnings = await fetchFloodWarnings([]);

    expect(warnings).toEqual([
      {
        id: '122FWF738',
        description: 'River Foss at York city centre',
        county: 'York',
        riverOrSea: 'River Foss',
        severity: 'Flood warning',
        severityLevel: 2,
        message: 'Flooding is expected on Foss Islands Road.',
        timeMessageChanged: '2024-11-25T09:15:00',
        polygonData: [
          {
            area: 'Yorkshire',
            description: 'River Foss at York city centre',
            geometry: fossWarningArea.geometry,
          },
        ],
      },
    ]);
  });

  it('leaves an area without an outline when its outline fails to download', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    serveFloods(floodItem(fossWarningArea, 2), floodItem(ouseAlertArea, 3));
    server.use(
      http.get(`${FLOOD_AREAS_URL}/${fossWarningArea.id}/polygon`, () =>
        serviceUnavailable(),
      ),
    );

    const warnings = await fetchFloodWarnings([]);

    expect(warnings.map((warning) => warning.polygonData.length)).toEqual([
      0, 1,
    ]);
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it('keeps the polygons of an outline and leaves out any other shape', async () => {
    const outline = polygonResponse(fossWarningArea);
    serveFloods(floodItem(fossWarningArea, 2));
    server.use(
      http.get(`${FLOOD_AREAS_URL}/${fossWarningArea.id}/polygon`, () =>
        HttpResponse.json({
          ...outline,
          features: [
            ...outline.features,
            {
              ...outline.features[0],
              geometry: { type: 'Point', coordinates: [-1.08, 53.96] },
            },
          ],
        }),
      ),
    );

    const [warning] = await fetchFloodWarnings([]);

    expect(warning.polygonData).toEqual([
      {
        area: 'Yorkshire',
        description: 'River Foss at York city centre',
        geometry: fossWarningArea.geometry,
      },
    ]);
  });

  it('fails when the list of warnings cannot be downloaded', async () => {
    server.use(http.get(FLOODS_URL, () => serviceUnavailable()));

    await expect(fetchFloodWarnings([])).rejects.toThrow(
      'Could not fetch flood warnings: 503',
    );
  });
});
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FLOODS_URL,
  watchDownloads,
} from '../../../website/src/demo/downloads';
import {
  FLOOD_AREAS_URL,
  FloodAreaFixture,
  floodItem,
  fossWarningArea,
  ouseAlertArea,
  polygonResponse,
  severnAlertArea,
} from '../../support/floodData';
import { NOMINATIM_URL } from '../../support/nominatim';
import {
  requests,
  server,
  serveFloods,
  serviceUnavailable,
} from '../../support/server';

import { storeFloodWarningsInDB } from '@/chrome-extension/services/floodDatabase';
import { FloodWarning } from '@/types/types';

/* Opening a database fails the way it does in Firefox when the user blocks sites from saving data */
const blockedDatabases = {
  open() {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  },
};

const storedWarning = (
  area: FloodAreaFixture,
  withOutline: boolean,
): FloodWarning => ({
  id: area.id,
  description: area.description,
  county: area.county,
  severity: 'Flood warning',
  severityLevel: 2,
  message: '',
  riverOrSea: area.riverOrSea,
  timeMessageChanged: '',
  polygonData: withOutline
    ? [{ area: area.eaAreaName, description: '', geometry: area.geometry }]
    : [],
});

let events: {
  outlinesExpected: ReturnType<typeof vi.fn>;
  outlineDone: ReturnType<typeof vi.fn>;
};
let target: { fetch: typeof fetch };
let downloads: ReturnType<typeof watchDownloads>;

beforeEach(() => {
  events = { outlinesExpected: vi.fn(), outlineDone: vi.fn() };
  target = { fetch: globalThis.fetch };
  downloads = watchDownloads(events, target);
});

describe('watchDownloads', () => {
  it('expects an outline for each warning whose area has none stored yet, and passes the list on unchanged', async () => {
    await storeFloodWarningsInDB([
      storedWarning(fossWarningArea, true),
      storedWarning(ouseAlertArea, false),
    ]);
    serveFloods(
      floodItem(fossWarningArea, 2),
      floodItem(ouseAlertArea, 3),
      floodItem(severnAlertArea, 3),
    );

    const response = await target.fetch(FLOODS_URL);

    expect(events.outlinesExpected).toHaveBeenCalledWith(2);
    expect((await response.json()).items).toHaveLength(3);
    expect(downloads.latestFailed()).toBe(false);
  });

  it("expects an outline for every warning when the stored ones can't be read", async () => {
    vi.stubGlobal('indexedDB', blockedDatabases);
    serveFloods(floodItem(fossWarningArea, 2), floodItem(ouseAlertArea, 3));

    await target.fetch(FLOODS_URL);

    expect(events.outlinesExpected).toHaveBeenCalledWith(2);
  });

  it('only expects outlines for the first download of the list, as only its progress shows', async () => {
    serveFloods(floodItem(fossWarningArea, 2));

    await target.fetch(FLOODS_URL);
    await target.fetch(FLOODS_URL);

    expect(events.outlinesExpected).toHaveBeenCalledOnce();
  });

  it('counts an outline as done once its download ends, whether it works or not, and passes it on unchanged', async () => {
    let answer!: () => void;
    const answered = new Promise<void>((resolve) => {
      answer = resolve;
    });
    server.use(
      http.get(`${FLOOD_AREAS_URL}/:id/polygon`, async () => {
        await answered;
        return HttpResponse.json(polygonResponse(fossWarningArea));
      }),
    );

    const download = target.fetch(
      `${FLOOD_AREAS_URL}/${fossWarningArea.id}/polygon`,
    );
    await vi.waitFor(() => expect(requests).toHaveLength(1));
    const doneWhileDownloading = events.outlineDone.mock.calls.length;
    answer();
    const outline = await download;
    server.resetHandlers();
    const missing = await target.fetch(`${FLOOD_AREAS_URL}/unknown/polygon`);

    expect(doneWhileDownloading).toBe(0);
    expect(events.outlineDone).toHaveBeenCalledTimes(2);
    expect((await outline.json()).features[0].geometry).toEqual(
      fossWarningArea.geometry,
    );
    expect(missing.status).toBe(404);
  });

  it('marks the download failed when the list comes back as an error or not at all, until one works', async () => {
    server.use(http.get(FLOODS_URL, () => serviceUnavailable()));
    const errorPage = await target.fetch(FLOODS_URL);
    const failedOnError = downloads.latestFailed();

    server.use(http.get(FLOODS_URL, () => HttpResponse.error()));
    await expect(target.fetch(FLOODS_URL)).rejects.toThrow();
    const failedOffline = downloads.latestFailed();

    serveFloods(floodItem(fossWarningArea, 2));
    await target.fetch(FLOODS_URL);

    expect(errorPage.status).toBe(503);
    expect(failedOnError).toBe(true);
    expect(failedOffline).toBe(true);
    expect(downloads.latestFailed()).toBe(false);
  });

  it('leaves every other request alone', async () => {
    const response = await target.fetch(`${NOMINATIM_URL}?q=York&format=json`);

    expect(response.ok).toBe(true);
    expect(events.outlinesExpected).not.toHaveBeenCalled();
    expect(events.outlineDone).not.toHaveBeenCalled();
  });
});
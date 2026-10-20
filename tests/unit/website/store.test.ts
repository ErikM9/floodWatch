import { describe, expect, it, vi } from 'vitest';

import { createDemoStore } from '../../../website/src/demo/store';
import { fossWarningArea, ouseAlertArea } from '../../support/floodData';

import { FloodWarning } from '@/types/types';

const warning = (
  id: string,
  severityLevel: number,
  geometry = fossWarningArea.geometry,
): FloodWarning => ({
  id,
  description: `Area ${id}`,
  county: 'York',
  severity: 'Flood warning',
  severityLevel,
  message: '',
  riverOrSea: 'River Foss',
  timeMessageChanged: '',
  polygonData: [{ area: 'Yorkshire', description: '', geometry }],
});

describe('the demo store', () => {
  it('records a finished check: its time and the warnings at each level', () => {
    const store = createDemoStore();

    store.checkFinished(
      [
        warning('a', 1),
        warning('b', 2),
        warning('c', 3),
        warning('d', 3),
        warning('e', 4),
      ],
      false,
      1_000,
    );

    expect(store.getState()).toMatchObject({
      firstCheckDone: true,
      latestFailed: false,
      checkedAt: 1_000,
      stored: 5,
      inForce: { severe: 1, warnings: 1, alerts: 2 },
    });
  });

  it('works out the places to try and a new version of the map when the areas change', () => {
    const store = createDemoStore();
    store.checkFinished([warning('a', 2)], false, 1_000);
    const before = store.getState();

    store.checkFinished(
      [warning('a', 1), warning('b', 3, ouseAlertArea.geometry)],
      false,
      2_000,
    );

    expect(before.places.map(({ id }) => id)).toEqual(['a']);
    expect(store.getState().places.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(store.getState().mapVersion).toBe(before.mapVersion + 1);
  });

  it('keeps the places and the version of the map while the areas stay the same', () => {
    const store = createDemoStore();
    store.checkFinished([warning('a', 2)], false, 1_000);
    const before = store.getState();

    store.checkFinished(
      [{ ...warning('a', 2), message: 'Flooding is expected.' }],
      false,
      2_000,
    );

    expect(store.getState().places).toBe(before.places);
    expect(store.getState().mapVersion).toBe(before.mapVersion);
  });

  it('counts an outline which arrives a check late as a change to the areas', () => {
    const store = createDemoStore();
    store.checkFinished(
      [{ ...warning('a', 2), polygonData: [] }],
      false,
      1_000,
    );
    const before = store.getState();

    store.checkFinished([warning('a', 2)], false, 2_000);

    expect(before.places).toEqual([]);
    expect(store.getState().places.map(({ id }) => id)).toEqual(['a']);
    expect(store.getState().mapVersion).toBe(before.mapVersion + 1);
  });

  it('keeps the time of the last check that worked when a download fails', () => {
    const store = createDemoStore();
    store.checkFinished([], false, 1_000);

    store.checkFinished([], true, 2_000);

    expect(store.getState()).toMatchObject({
      latestFailed: true,
      checkedAt: 1_000,
    });
  });

  it('records that the warnings could not be stored until a check can read them again', () => {
    const store = createDemoStore();
    store.storageFailed();
    const blocked = store.getState();

    store.checkFinished([], false, 1_000);

    expect(blocked).toMatchObject({
      firstCheckDone: true,
      storageBlocked: true,
    });
    expect(store.getState().storageBlocked).toBe(false);
  });

  it('counts outlines as they arrive, from zero again for each download', () => {
    const store = createDemoStore();
    store.outlinesExpected(3);
    store.outlineDone();
    store.outlineDone();
    const partWay = store.getState().outlines;

    store.outlinesExpected(1);

    expect(partWay).toEqual({ done: 2, total: 3 });
    expect(store.getState().outlines).toEqual({ done: 0, total: 1 });
  });

  it('holds a notification until it is dismissed', () => {
    const store = createDemoStore();
    const notification = {
      id: 'flood-alert',
      title: 'Your area at risk!',
      message: 'Warning: Flood warning.',
      iconUrl: 'icon.png',
    };

    store.notify(notification);
    const shown = store.getState().notification;
    store.dismissNotification();

    expect(shown).toEqual(notification);
    expect(store.getState().notification).toBeNull();
  });

  it('tells a listener about each change until it unsubscribes', () => {
    const store = createDemoStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.openOptionsPage();
    unsubscribe();
    store.openOptionsPage();

    expect(listener).toHaveBeenCalledOnce();
  });
});
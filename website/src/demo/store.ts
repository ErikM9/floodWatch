import { useSyncExternalStore } from 'react';

import { pickPlaces, Place } from './places';
import { DemoNotification } from './runtime';

import { FloodWarning } from '@/types/types';

export interface DemoState {
  firstCheckDone: boolean;
  storageBlocked: boolean;
  latestFailed: boolean;
  checkedAt: number | null;
  stored: number;
  inForce: { severe: number; warnings: number; alerts: number };
  outlines: { done: number; total: number };
  places: Place[];
  mapVersion: number;
  notification: DemoNotification | null;
  optionsPageRequests: number;
}

export const initialState: DemoState = {
  firstCheckDone: false,
  storageBlocked: false,
  latestFailed: false,
  checkedAt: null,
  stored: 0,
  inForce: { severe: 0, warnings: 0, alerts: 0 },
  outlines: { done: 0, total: 0 },
  places: [],
  mapVersion: 0,
  notification: null,
  optionsPageRequests: 0,
};

/* Holds what the page shows about the demo, for React to follow */
export function createDemoStore(state: DemoState = initialState) {
  const listeners = new Set<() => void>();
  let drawnAreas = '';
  const update = (patch: Partial<DemoState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    outlinesExpected: (total: number) =>
      update({ outlines: { done: 0, total } }),
    outlineDone: () =>
      update({
        outlines: { ...state.outlines, done: state.outlines.done + 1 },
      }),
    /* Keeps the time of the last download that worked, and only redoes the places and the map when the areas change */
    checkFinished(warnings: FloodWarning[], failed: boolean, at: number) {
      const atLevel = (level: number) =>
        warnings.filter((warning) => warning.severityLevel === level).length;
      const areas = warnings
        .filter((warning) => warning.polygonData.length)
        .map((warning) => `${warning.id} ${warning.severityLevel}`)
        .join();
      const areasChanged = areas !== drawnAreas;
      drawnAreas = areas;

      update({
        firstCheckDone: true,
        storageBlocked: false,
        latestFailed: failed,
        checkedAt: failed ? state.checkedAt : at,
        stored: warnings.length,
        inForce: {
          severe: atLevel(1),
          warnings: atLevel(2),
          alerts: atLevel(3),
        },
        ...(areasChanged && {
          places: pickPlaces(warnings),
          mapVersion: state.mapVersion + 1,
        }),
      });
    },
    storageFailed: () => update({ firstCheckDone: true, storageBlocked: true }),
    notify: (notification: DemoNotification) => update({ notification }),
    dismissNotification: () => update({ notification: null }),
    openOptionsPage: () =>
      update({ optionsPageRequests: state.optionsPageRequests + 1 }),
  };
}

export type DemoStore = ReturnType<typeof createDemoStore>;

export const demoStore = createDemoStore();

export const useDemoState = (store: DemoStore = demoStore) =>
  useSyncExternalStore(store.subscribe, store.getState);
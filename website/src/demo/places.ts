import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { MultiPolygon, Polygon, Position } from 'geojson';

import { findUserFlood } from '@/chrome-extension/services/FloodDataService';
import { FloodWarning } from '@/types/types';

export interface Place {
  id: string;
  description: string;
  severity: string;
  severityLevel: number;
  location: [number, number];
}

const GRID = 15;

/* Loops instead of spreading into Math.min, as an outline can have more points than a call takes arguments */
function bounds(ring: Position[]) {
  let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of ring) {
    west = Math.min(west, x);
    east = Math.max(east, x);
    south = Math.min(south, y);
    north = Math.max(north, y);
  }
  return { west, south, east, north };
}

const area = ({ west, south, east, north }: ReturnType<typeof bounds>) =>
  (east - west) * (north - south);

/* Finds the point nearest the middle of an outline's largest part that the check accepts, trying a corner last */
export function pointInside(
  geometry: Polygon | MultiPolygon,
  accepts: (location: [number, number]) => boolean,
): [number, number] | null {
  const parts =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const part = parts.reduce((largest, candidate) =>
    area(bounds(candidate[0])) > area(bounds(largest[0])) ? candidate : largest,
  );
  const outline: Polygon = { type: 'Polygon', coordinates: part };
  const { west, south, east, north } = bounds(part[0]);
  const fromMiddle = ([x, y]: Position) =>
    Math.hypot(x - (west + east) / 2, y - (south + north) / 2);
  const grid: Position[] = [];

  for (let column = 0; column < GRID; column++) {
    for (let row = 0; row < GRID; row++) {
      grid.push([
        west + ((column + 0.5) / GRID) * (east - west),
        south + ((row + 0.5) / GRID) * (north - south),
      ]);
    }
  }
  grid.sort((first, second) => fromMiddle(first) - fromMiddle(second));

  for (const candidate of [...grid, part[0][0]]) {
    const location: [number, number] = [candidate[1], candidate[0]];
    if (booleanPointInPolygon(point(candidate), outline) && accepts(location)) {
      return location;
    }
  }

  return null;
}

/* Offers the gravest warnings in force first, each at a point where it is the warning the extension finds */
export function pickPlaces(warnings: FloodWarning[], limit = 3): Place[] {
  const inForce = warnings
    .filter(
      (warning) => warning.severityLevel < 4 && warning.polygonData.length,
    )
    .sort(
      (first, second) =>
        first.severityLevel - second.severityLevel ||
        first.description.localeCompare(second.description),
    );
  const places: Place[] = [];

  for (const warning of inForce) {
    const location = pointInside(
      warning.polygonData[0].geometry,
      (candidate) => findUserFlood(warnings, candidate)?.id === warning.id,
    );

    if (location) {
      places.push({
        id: warning.id,
        description: warning.description,
        severity: warning.severity,
        severityLevel: warning.severityLevel,
        location,
      });
    }
    if (places.length === limit) break;
  }

  return places;
}
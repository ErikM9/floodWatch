import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import {
  FLOOD_AREAS_URL,
  FLOODS_URL,
  floodAreaById,
  floodsResponse,
  polygonResponse,
} from './floodData';
import { NOMINATIM_URL, searchPlaces } from './nominatim';

import { FloodItem } from '@/types/api';

export const server = setupServer(
  http.get(FLOODS_URL, () => HttpResponse.json(floodsResponse([]))),
  http.get(`${FLOOD_AREAS_URL}/:id/polygon`, ({ params }) => {
    const area = floodAreaById(String(params.id));
    return area
      ? HttpResponse.json(polygonResponse(area))
      : new HttpResponse('Not Found', { status: 404 });
  }),
  http.get(NOMINATIM_URL, ({ request }) =>
    HttpResponse.json(searchPlaces(new URL(request.url))),
  ),
);

/* Every request the code under test has made, in order */
export const requests: string[] = [];

server.events.on('request:start', ({ request }) => {
  requests.push(request.url);
});

export function serveFloods(...items: FloodItem[]) {
  server.use(
    http.get(FLOODS_URL, () => HttpResponse.json(floodsResponse(items))),
  );
}

export const serviceUnavailable = () =>
  new HttpResponse('<html><body>503 Service Unavailable</body></html>', {
    status: 503,
    headers: { 'Content-Type': 'text/html' },
  });
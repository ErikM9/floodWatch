import type { BrowserContext, Route } from '@playwright/test';

import {
  FLOOD_AREAS_URL,
  FLOODS_URL,
  floodAreaById,
  floodsResponse,
  polygonResponse,
} from '../../support/floodData';
import { NOMINATIM_URL, searchPlaces } from '../../support/nominatim';

import type { FloodItem } from '@/types/api';

/* A blank map tile, as an image the map can draw */
const TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

/* Both services allow requests from any origin, so the answers carry the same header */
const anyOrigin = { 'Access-Control-Allow-Origin': '*' };

/* Stands in for the Environment Agency, Nominatim, the map tiles and the fonts, and records the requests they receive */
export class FakeServices {
  floods: FloodItem[] = [];
  floodsUnavailable = false;
  readonly requests: string[] = [];
  readonly unexpected: string[] = [];
  private outlinesReleased = Promise.resolve();

  async attach(context: BrowserContext) {
    await context.route(/^https?:\/\//, (route) => this.answer(route));
  }

  requestsTo(url: string) {
    return this.requests.filter((request) => request === url);
  }

  /* Keeps the outlines of the flood areas from arriving until the function it returns is called */
  holdOutlines() {
    let release!: () => void;
    this.outlinesReleased = new Promise((resolve) => {
      release = resolve;
    });
    return release;
  }

  private async answer(route: Route) {
    const url = new URL(route.request().url());
    /* The website's tests load the site from a local server, which answers for itself */
    if (url.hostname === '127.0.0.1') return route.continue();
    this.requests.push(url.href.split('?')[0]);

    if (url.href === FLOODS_URL && this.floodsUnavailable) {
      return route.fulfill({
        status: 503,
        body: 'Service Unavailable',
        headers: anyOrigin,
      });
    }
    if (url.href === FLOODS_URL) {
      return route.fulfill({
        json: floodsResponse(this.floods),
        headers: anyOrigin,
      });
    }
    if (url.href.startsWith(FLOOD_AREAS_URL)) {
      await this.outlinesReleased;
      const area = floodAreaById(url.pathname.split('/').at(-2) ?? '');
      return area
        ? route.fulfill({ json: polygonResponse(area), headers: anyOrigin })
        : route.fulfill({ status: 404, body: 'Not Found', headers: anyOrigin });
    }
    if (url.href.startsWith(NOMINATIM_URL)) {
      return route.fulfill({ json: searchPlaces(url), headers: anyOrigin });
    }
    if (url.hostname === 'tile.openstreetmap.org') {
      return route.fulfill({ contentType: 'image/png', body: TILE });
    }
    if (url.hostname === 'fonts.googleapis.com') {
      return route.fulfill({ contentType: 'text/css', body: '' });
    }
    this.unexpected.push(url.href);
    return route.abort();
  }
}
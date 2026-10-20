import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { NOMINATIM_URL } from '../support/nominatim';
import { server, serviceUnavailable } from '../support/server';

import { userAddress } from '@/chrome-extension/api/geocoding';

describe('userAddress', () => {
  it('finds the coordinates of an address in England', async () => {
    const lookup = await userAddress('York');

    expect(lookup).toEqual({
      status: 'found',
      latitude: 53.9590555,
      longitude: -1.0815361,
    });
  });

  it('picks the first match in England when a better match lies elsewhere', async () => {
    const lookup = await userAddress('Newport');

    expect(lookup).toEqual({
      status: 'found',
      latitude: 50.7006345,
      longitude: -1.2938823,
    });
  });

  it('reports an address outside England', async () => {
    const lookup = await userAddress('Cardiff');

    expect(lookup).toEqual({ status: 'outside-england' });
  });

  it('reports an address it cannot find', async () => {
    const lookup = await userAddress('1 Atlantis Road');

    expect(lookup).toEqual({ status: 'not-found' });
  });

  it('reports a failed lookup when the search service answers with an error', async () => {
    server.use(http.get(NOMINATIM_URL, () => serviceUnavailable()));

    const lookup = await userAddress('York');

    expect(lookup).toEqual({ status: 'failed' });
  });

  it('reports a failed lookup when the search service cannot be reached', async () => {
    server.use(http.get(NOMINATIM_URL, () => HttpResponse.error()));

    const lookup = await userAddress('York');

    expect(lookup).toEqual({ status: 'failed' });
  });
});
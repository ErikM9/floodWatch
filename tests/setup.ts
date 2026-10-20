import '@testing-library/jest-dom/vitest';
import { IDBFactory } from 'fake-indexeddb';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

import { installChrome } from './support/chrome';
import { requests, server } from './support/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

beforeEach(() => {
  installChrome();
  vi.stubGlobal('indexedDB', new IDBFactory());
  requests.length = 0;
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

afterAll(() => server.close());
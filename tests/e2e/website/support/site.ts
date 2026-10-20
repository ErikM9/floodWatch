import { test as base, expect, type FrameLocator } from '@playwright/test';

import { FakeServices } from '../../support/services';

interface SiteFixtures {
  services: FakeServices;
  popup: FrameLocator;
  settings: FrameLocator;
}

export const test = base.extend<SiteFixtures>({
  services: async ({}, use) => {
    await use(new FakeServices());
  },

  context: async ({ context, services }, use) => {
    await services.attach(context);
    await use(context);
    expect(services.unexpected, 'requests to unknown hosts').toEqual([]);
  },

  popup: async ({ page }, use) => {
    await use(page.getByTitle('FloodWatch popup').contentFrame());
  },

  settings: async ({ page }, use) => {
    await use(page.getByTitle('FloodWatch settings page').contentFrame());
  },
});

export { expect };
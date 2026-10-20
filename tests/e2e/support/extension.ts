import { fileURLToPath } from 'url';

import {
  test as base,
  chromium,
  expect,
  type BrowserContext,
  type Page,
  type Worker,
} from '@playwright/test';

import { FakeServices } from './services';
import { FLOODS_URL } from '../../support/floodData';

const extensionPath = fileURLToPath(new URL('../../../dist', import.meta.url));

interface ExtensionFixtures {
  services: FakeServices;
  context: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
  openPopup: () => Promise<Page>;
  openSettings: () => Promise<Page>;
}

export const test = base.extend<ExtensionFixtures>({
  services: async ({}, use) => {
    await use(new FakeServices());
  },

  context: async ({ services }, use, testInfo) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        /* A request that slips past the fake services can't reach the real ones */
        '--host-resolver-rules=MAP * ~NOTFOUND',
      ],
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    await services.attach(context);

    await use(context);

    const failed = testInfo.status !== testInfo.expectedStatus;
    await context.tracing.stop(
      failed ? { path: testInfo.outputPath('trace.zip') } : undefined,
    );
    await context.close();
    expect(services.unexpected, 'requests to unknown hosts').toEqual([]);
  },

  serviceWorker: async ({ context }, use) => {
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker'));
    /* The extension APIs appear a moment after the worker starts, and the first check has run once its outcome is recorded */
    await expect
      .poll(() =>
        worker.evaluate(
          async () =>
            chrome.storage !== undefined &&
            'lastSentAlert' in
              (await chrome.storage.local.get('lastSentAlert')),
        ),
      )
      .toBe(true);
    await use(worker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host);
  },

  openPopup: async ({ context, extensionId }, use) => {
    await use(async () => {
      const popup = await context.newPage();
      await popup.setViewportSize({ width: 350, height: 444 });
      await popup.goto(`chrome-extension://${extensionId}/popup.html`);
      return popup;
    });
  },

  openSettings: async ({ context, extensionId }, use) => {
    await use(async () => {
      const settings = await context.newPage();
      await settings.goto(`chrome-extension://${extensionId}/options.html`);
      return settings;
    });
  },
});

/* Runs the scheduled check straight away instead of waiting for the next minute */
export async function runScheduledCheck(
  serviceWorker: Worker,
  services: FakeServices,
) {
  const downloads = services.requestsTo(FLOODS_URL).length;
  await serviceWorker.evaluate(() =>
    chrome.alarms.create('checkFloods', { when: Date.now() }),
  );
  await expect
    .poll(() => services.requestsTo(FLOODS_URL).length)
    .toBe(downloads + 1);
}

/* Reads what the extension has recorded for the saved location */
export const recordedAlert = (serviceWorker: Worker) =>
  serviceWorker.evaluate(
    async () => (await chrome.storage.local.get('lastSentAlert')).lastSentAlert,
  );

export { expect };
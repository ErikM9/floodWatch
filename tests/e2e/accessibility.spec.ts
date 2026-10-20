import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

import { floodItem, fossWarningArea, locations } from '../support/floodData';
import {
  expect,
  recordedAlert,
  runScheduledCheck,
  test,
} from './support/extension';

/* The colour contrast rule is left out, as the severity colours and button colours are a design choice kept as they are */
const scan = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(['color-contrast'])
    .analyze();

test.beforeEach(async ({ serviceWorker, services }) => {
  services.floods = [floodItem(fossWarningArea, 2)];
  await serviceWorker.evaluate(
    (location) => chrome.storage.local.set({ userLocation: location }),
    locations.yorkCityCentre,
  );
  await runScheduledCheck(serviceWorker, services);
  await expect.poll(() => recordedAlert(serviceWorker)).toBeTruthy();
});

test('the popup passes the axe WCAG 2.1 A and AA scan, colour contrast aside', async ({
  openPopup,
}) => {
  const popup = await openPopup();
  await expect(popup.getByText('Severity: Flood warning')).toBeVisible();

  const { violations } = await scan(popup);

  expect(violations).toEqual([]);
});

test('the settings page passes the axe WCAG 2.1 A and AA scan, colour contrast aside', async ({
  openSettings,
}) => {
  const settings = await openSettings();
  await expect(settings.getByRole('button', { name: 'Marker' })).toBeVisible();

  const { violations } = await scan(settings);

  expect(violations).toEqual([]);
});
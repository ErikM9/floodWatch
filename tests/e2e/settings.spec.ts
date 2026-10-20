import type { Page } from '@playwright/test';

import {
  floodItem,
  fossWarningArea,
  locations,
  ouseAlertArea,
  severnAlertArea,
} from '../support/floodData';
import {
  expect,
  recordedAlert,
  runScheduledCheck,
  test,
} from './support/extension';

/* Leaflet gives the map, the pane it drags and the areas it draws no role, so they are found by its class names */
const mapOf = (page: Page) => page.locator('.leaflet-container');

async function search(page: Page, address: string) {
  await page
    .getByRole('textbox', { name: /Location to monitor/ })
    .fill(address);
  await page.getByRole('button', { name: 'View my location' }).click();
}

async function dragMap(page: Page) {
  const box = await mapOf(page).boundingBox();
  await page.mouse.move(box!.x + 200, box!.y + 150);
  await page.mouse.down();
  await page.mouse.move(box!.x + 320, box!.y + 210, { steps: 8 });
  await page.mouse.up();
}

/* How far the tip of the pin, 12px across and 41px down its icon, lies from the middle of the map */
async function pinOffset(page: Page) {
  const pin = await page.getByRole('button', { name: 'Marker' }).boundingBox();
  const view = await mapOf(page).boundingBox();
  return Math.max(
    Math.abs(pin!.x + 12 - (view!.x + view!.width / 2)),
    Math.abs(pin!.y + 41 - (view!.y + view!.height / 2)),
  );
}

test('centres the map on a found address, marks it and reports the most severe warning there', async ({
  openSettings,
  serviceWorker,
  services,
}) => {
  services.floods = [
    floodItem(ouseAlertArea, 3),
    floodItem(fossWarningArea, 2),
  ];
  await runScheduledCheck(serviceWorker, services);
  const settings = await openSettings();

  await search(settings, 'York');

  await expect(settings.getByRole('button', { name: 'Marker' })).toBeVisible();
  await expect.poll(() => pinOffset(settings)).toBeLessThanOrEqual(1);
  await expect(settings.getByText('Severity: Flood warning')).toBeVisible();
  await expect(settings.getByText('River or sea: River Foss')).toBeVisible();
});

test('centres the map again when the same address is searched after the map was moved', async ({
  openSettings,
}) => {
  const settings = await openSettings();
  await search(settings, 'York');
  await expect.poll(() => pinOffset(settings)).toBeLessThanOrEqual(1);
  await dragMap(settings);
  await expect.poll(() => pinOffset(settings)).toBeGreaterThan(50);

  await search(settings, 'York');

  await expect.poll(() => pinOffset(settings)).toBeLessThanOrEqual(1);
});

test('draws each flood area in the colour of its severity, the most severe on top', async ({
  openSettings,
  serviceWorker,
  services,
}) => {
  services.floods = [
    floodItem(fossWarningArea, 2),
    floodItem(ouseAlertArea, 3),
    floodItem(severnAlertArea, 4),
  ];
  await serviceWorker.evaluate(
    (location) => chrome.storage.local.set({ userLocation: location }),
    locations.yorkCityCentre,
  );
  await runScheduledCheck(serviceWorker, services);
  await expect.poll(() => recordedAlert(serviceWorker)).toBeTruthy();

  const settings = await openSettings();

  await expect(settings.locator('path.leaflet-interactive')).toHaveCount(3);
  const outlines = await settings
    .locator('path.leaflet-interactive')
    .evaluateAll((paths) => paths.map((path) => path.getAttribute('stroke')));
  expect(outlines).toEqual(['#008000', '#218ced', '#FFA500']);
});

test('leaves the map where it was moved when the page updates', async ({
  openSettings,
}) => {
  const settings = await openSettings();
  const pane = settings.locator('.leaflet-map-pane');
  /* The map glides on after a drag, so its position is read once it has come to rest */
  const restingPosition = async () => {
    let previous = '';
    await expect
      .poll(async () => {
        const current = await pane.evaluate(
          (element) => element.style.transform,
        );
        const resting = current === previous;
        previous = current;
        return resting;
      })
      .toBe(true);
    return previous;
  };

  await dragMap(settings);
  const moved = await restingPosition();
  await settings.getByRole('button', { name: 'View my location' }).click();
  await expect(settings.getByText('Please enter an address.')).toBeVisible();

  expect(moved).not.toBe('translate3d(0px, 0px, 0px)');
  expect(await restingPosition()).toBe(moved);
});
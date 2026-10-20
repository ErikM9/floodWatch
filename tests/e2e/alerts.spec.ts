import { floodItem, fossWarningArea } from '../support/floodData';
import { expect, runScheduledCheck, test } from './support/extension';

test('notifies once alerts are on and the saved location is inside a warning area', async ({
  openPopup,
  openSettings,
  serviceWorker,
  services,
}) => {
  services.floods = [floodItem(fossWarningArea, 2)];
  await runScheduledCheck(serviceWorker, services);
  const popup = await openPopup();
  await popup.getByRole('button', { name: 'Turn ON Alerts' }).click();
  const settings = await openSettings();

  await settings
    .getByRole('textbox', { name: /Location to monitor/ })
    .fill('York');
  await settings.getByRole('button', { name: 'View my location' }).click();

  await expect
    .poll(() =>
      serviceWorker.evaluate(
        () => new Promise((resolve) => chrome.notifications.getAll(resolve)),
      ),
    )
    .toEqual({ 'flood-alert': true });
});

test('leaves checking for floods to the background service worker', async ({
  openSettings,
}) => {
  const settings = await openSettings();
  await expect(
    settings.getByRole('heading', { name: 'Flood Report' }),
  ).toBeVisible();

  const listeners = await settings.evaluate(() => ({
    alarm: chrome.alarms.onAlarm.hasListeners(),
    install: chrome.runtime.onInstalled.hasListeners(),
  }));

  expect(listeners).toEqual({ alarm: false, install: false });
});

test('asks only for the permissions it uses', async ({ serviceWorker }) => {
  const manifest = await serviceWorker.evaluate(() =>
    chrome.runtime.getManifest(),
  );

  expect(manifest.permissions).toEqual(['storage', 'notifications', 'alarms']);
  expect(manifest.host_permissions).toEqual([
    'https://environment.data.gov.uk/*',
  ]);
  expect(manifest.content_scripts).toBeUndefined();
  expect(manifest.web_accessible_resources).toBeUndefined();
});
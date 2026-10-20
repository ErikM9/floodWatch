import { floodItem, fossWarningArea, locations } from '../support/floodData';
import {
  expect,
  recordedAlert,
  runScheduledCheck,
  test,
} from './support/extension';

test('shows no alerts before a location is saved and remembers that alerts were turned on', async ({
  openPopup,
}) => {
  const popup = await openPopup();
  await expect(
    popup.getByText('Your area currently has no active alerts.'),
  ).toBeVisible();

  await popup.getByRole('button', { name: 'Turn ON Alerts' }).click();
  await popup.close();
  const reopened = await openPopup();

  await expect(reopened.getByText('Alerts are currently:')).toHaveText(
    'Alerts are currently: ON',
  );
  await expect(
    reopened.getByRole('button', { name: 'Turn OFF Alerts' }),
  ).toBeVisible();
});

test('shows the alert for the saved location and opens the settings page', async ({
  context,
  openPopup,
  serviceWorker,
  services,
}) => {
  services.floods = [floodItem(fossWarningArea, 2)];
  await serviceWorker.evaluate(
    (location) => chrome.storage.local.set({ userLocation: location }),
    locations.yorkCityCentre,
  );
  await runScheduledCheck(serviceWorker, services);
  await expect.poll(() => recordedAlert(serviceWorker)).toBeTruthy();
  const popup = await openPopup();

  await expect(
    popup.getByText('2 - flooding is expected, immediate action required!'),
  ).toBeVisible();
  const [settings] = await Promise.all([
    context.waitForEvent('page'),
    popup.getByRole('link', { name: 'Settings' }).click(),
  ]);
  await expect(
    settings.getByRole('heading', { name: 'Flood Report' }),
  ).toBeVisible();
  await expect(settings.getByText('River or sea: River Foss')).toBeVisible();
});
import { test, expect } from './support/site';
import {
  FLOODS_URL,
  floodItem,
  fossWarningArea,
  ouseAlertArea,
  severnAlertArea,
} from '../../support/floodData';

test.describe('Live demo', () => {
  test('reports the warnings in force, maps them and offers the places they cover, gravest first', async ({
    page,
    services,
    settings,
  }) => {
    services.floods = [
      floodItem(ouseAlertArea, 3),
      floodItem(severnAlertArea, 4),
      floodItem(fossWarningArea, 2),
    ];

    await page.goto('/');

    await expect(page.getByRole('status')).toHaveText(
      'In force in England right now: 1 flood warning and 1 flood alert.',
    );
    await expect(page.getByText(/^Checked at \d\d:\d\d\.$/)).toBeVisible();
    await expect(
      page
        .getByRole('listitem')
        .filter({ has: page.getByRole('button', { name: /^River/ }) }),
    ).toHaveText([
      'River Foss at York city centre, Flood warning',
      'River Ouse catchment in York, Flood alert',
    ]);
    /* The settings page draws the areas the page downloaded, the lifted Severn warning included */
    await expect(settings.locator('path.leaflet-interactive')).toHaveCount(3);
  });

  test('shows how the first download is going, then the settings page with every area on its map and the popup over it', async ({
    page,
    services,
    popup,
    settings,
  }) => {
    services.floods = [
      floodItem(fossWarningArea, 2),
      floodItem(ouseAlertArea, 3),
    ];
    const releaseOutlines = services.holdOutlines();

    await page.goto('/');

    await expect(
      page.getByRole('progressbar', { name: 'Downloading the flood warnings' }),
    ).toBeVisible();
    await expect(
      page.getByText('Outlines of the flood areas: 0 of 2'),
    ).toBeVisible();
    await expect(page.getByTitle('FloodWatch settings page')).toHaveCount(0);
    await expect(page.getByTitle('FloodWatch popup')).toBeHidden();

    releaseOutlines();

    await expect(settings.locator('path.leaflet-interactive')).toHaveCount(2);
    await expect(
      popup.getByRole('button', { name: 'Turn ON Alerts' }),
    ).toBeVisible();
  });

  test('a place with a warning in force shows it in the popup and the report, and notifies once alerts are on', async ({
    page,
    services,
    popup,
    settings,
  }) => {
    services.floods = [floodItem(fossWarningArea, 2)];
    await page.goto('/');
    const place = page.getByRole('button', {
      name: 'River Foss at York city centre',
    });
    /* The severity is written out on the button, so its colour isn't the only sign of it */
    await expect
      .poll(
        async () =>
          (await place.getByText('Flood warning').boundingBox())?.width,
      )
      .toBeGreaterThan(50);

    await place.click();

    await expect(
      page.getByText('Saved a location in River Foss at York city centre.'),
    ).toBeVisible();
    await expect(popup.getByText('Severity: Flood warning')).toBeVisible();
    await expect(settings.getByText('County: York')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);

    await popup.getByRole('button', { name: 'Turn ON Alerts' }).click();

    const notification = page.getByRole('alert');
    await expect(notification).toContainText('Your area at risk!');
    await expect(notification).toContainText('Warning: Flood warning.');
    /* The icon is decorative, so it has no role to find it by */
    await expect
      .poll(() =>
        notification
          .locator('img')
          .evaluate((icon: HTMLImageElement) => icon.naturalWidth),
      )
      .toBe(128);
    await notification
      .getByRole('button', { name: 'Close the notification' })
      .click();
    await expect(notification).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'FloodWatch popup' }),
    ).toBeFocused();
  });

  test('an address found on the settings page is checked like a saved place', async ({
    page,
    services,
    popup,
    settings,
  }) => {
    services.floods = [floodItem(fossWarningArea, 2)];
    await page.goto('/');

    await settings
      .getByRole('textbox', { name: /Location to monitor/ })
      .fill('York');
    await settings.getByRole('button', { name: 'View my location' }).click();

    await expect(settings.getByText('River or sea: River Foss')).toBeVisible();
    await page.getByRole('button', { name: 'FloodWatch popup' }).click();
    await expect(
      popup.getByText('Description: River Foss at York city centre'),
    ).toBeVisible();
  });

  test('checks the Environment Agency again every minute', async ({
    page,
    services,
  }) => {
    await page.clock.install();
    await page.goto('/');
    await expect(page.getByRole('status')).toHaveText(
      'No flood warnings or alerts are in force in England right now.',
    );

    services.floods = [floodItem(fossWarningArea, 2)];
    await page.clock.fastForward('01:00');

    await expect(page.getByRole('status')).toHaveText(
      'In force in England right now: 1 flood warning.',
    );
    expect(services.requestsTo(FLOODS_URL)).toHaveLength(2);
  });

  test("explains when the Environment Agency's warnings can't be downloaded, and maps them once a download works", async ({
    page,
    services,
    settings,
  }) => {
    services.floodsUnavailable = true;
    await page.clock.install();

    await page.goto('/');

    await expect(page.getByRole('status')).toHaveText(
      "The Environment Agency's flood warnings couldn't be downloaded. FloodWatch tries again every minute.",
    );
    await expect(
      settings.getByRole('textbox', { name: /Location to monitor/ }),
    ).toBeVisible();

    services.floodsUnavailable = false;
    services.floods = [floodItem(fossWarningArea, 2)];
    await page.clock.fastForward('01:00');

    await expect(page.getByRole('status')).toHaveText(
      'In force in England right now: 1 flood warning.',
    );
    await expect(settings.locator('path.leaflet-interactive')).toHaveCount(1);
  });

  test('explains that the demo needs to save data when the browser blocks it', async ({
    page,
  }) => {
    /* Opening a database fails the way it does in Firefox when the user blocks sites from saving data */
    await page.addInitScript(() => {
      IDBFactory.prototype.open = () => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      };
    });

    await page.goto('/');

    await expect(page.getByRole('status')).toHaveText(
      "This browser doesn't let the page save data, which the demo needs for the warnings it downloads. Allow this site to save data, then reload the page.",
    );
  });

  test('the popup opens from the toolbar, and its settings button, clicked or middle-clicked, and the settings page close it', async ({
    page,
    context,
    popup,
    settings,
  }) => {
    const toggle = page.getByRole('button', { name: 'FloodWatch popup' });
    const popupFrame = page.getByTitle('FloodWatch popup');
    await page.goto('/');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await popup.getByRole('link', { name: 'Settings' }).click();

    await expect(popupFrame).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTitle('FloodWatch settings page')).toBeFocused();

    await toggle.click();
    await popup
      .getByRole('link', { name: 'Settings' })
      .click({ button: 'middle' });
    await expect(popupFrame).toBeHidden();

    await toggle.click();
    await expect(popupFrame).toBeVisible();
    await settings
      .getByText('Type in your address to see your location on the map!')
      .click();
    await expect(popupFrame).toBeHidden();
    expect(context.pages()).toHaveLength(1);
  });

  test('a keyboard user reaches the popup straight after the toolbar button, and moving on to the settings page closes it', async ({
    page,
    popup,
    settings,
  }) => {
    const toggle = page.getByRole('button', { name: 'FloodWatch popup' });
    await page.goto('/');
    await expect(
      popup.getByRole('button', { name: 'Turn ON Alerts' }),
    ).toBeVisible();
    await expect(
      settings.getByRole('textbox', { name: /Location to monitor/ }),
    ).toBeVisible();

    await toggle.focus();
    await page.keyboard.press('Tab');
    await expect(popup.getByRole('link', { name: 'Settings' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      popup.getByRole('button', { name: 'Turn ON Alerts' }),
    ).toBeFocused();
    await page.keyboard.press('Tab');

    await expect(page.getByTitle('FloodWatch popup')).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test("the popup's settings button leaves focus on the toolbar while the settings page is still to come", async ({
    page,
    services,
    popup,
  }) => {
    services.floods = [floodItem(fossWarningArea, 2)];
    services.holdOutlines();
    const toggle = page.getByRole('button', { name: 'FloodWatch popup' });
    await page.goto('/');
    await expect(
      page.getByText('Outlines of the flood areas: 0 of 1'),
    ).toBeVisible();

    await toggle.click();
    await popup.getByRole('link', { name: 'Settings' }).click();

    await expect(page.getByTitle('FloodWatch popup')).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test('the credits on the map open in a new tab, leaving the settings page in place', async ({
    page,
    context,
    settings,
  }) => {
    await context.route('https://leafletjs.com/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<title>Leaflet</title>',
      }),
    );
    await page.goto('/');

    const [credits] = await Promise.all([
      context.waitForEvent('page'),
      settings.getByRole('link', { name: 'Leaflet' }).click(),
    ]);

    await expect(credits).toHaveURL('https://leafletjs.com/');
    await expect(
      settings.getByRole('textbox', { name: /Location to monitor/ }),
    ).toBeVisible();
  });

  test('a demo frame opened on its own leads to the page', async ({ page }) => {
    await page.goto('/demo/popup.html');

    await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:4173\/$/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Know when a flood warning covers your address',
      }),
    ).toBeVisible();
  });
});
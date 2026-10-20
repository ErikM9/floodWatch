import fs from 'fs';

import { unzipSync, strFromU8 } from 'fflate';

import { test, expect } from './support/site';

test.describe('Website', () => {
  test('downloads the extension build whose version it shows', async ({
    page,
  }) => {
    await page.goto('/');
    const version = (
      await page.getByText(/^Version \d+\.\d+\.\d+,/).textContent()
    )?.match(/\d+\.\d+\.\d+/)?.[0];

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Download FloodWatch' }).click(),
    ]);

    expect(download.suggestedFilename()).toBe('floodwatch.zip');
    const files = unzipSync(fs.readFileSync(await download.path()));
    const manifest = JSON.parse(strFromU8(files['floodwatch/manifest.json']));
    expect(manifest.version).toBe(version);
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        'floodwatch/popup.html',
        'floodwatch/options.html',
        'floodwatch/background.js',
        'floodwatch/public/128.png',
      ]),
    );
  });

  test('lets a keyboard user skip the header and go on from the start of the content', async ({
    page,
  }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');

    await expect(
      page.getByRole('link', { name: 'Install FloodWatch' }),
    ).toBeFocused();
  });

  test('brings each section into view from the navigation', async ({
    page,
  }) => {
    await page.goto('/');

    for (const [link, heading] of [
      ['How it works', 'How it works'],
      ['Install', 'Install FloodWatch'],
      ['Questions', 'Questions'],
    ]) {
      await page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('link', { name: link })
        .click();
      await expect(
        page.getByRole('heading', { level: 2, name: heading }),
      ).toBeInViewport();
    }
  });

  test('opens an answer when its question is clicked', async ({ page }) => {
    await page.goto('/');
    const answer = page.getByText(
      'No. The Environment Agency only covers England',
    );
    await expect(answer).toBeHidden();

    await page.getByText('Does it work outside England?').click();

    await expect(answer).toBeVisible();
  });

  for (const width of [320, 390]) {
    test(`fits a ${width} pixel wide phone without sideways scrolling or overlaps, popup included`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      const popup = page.getByTitle('FloodWatch popup');
      const demo = page.getByRole('region', {
        name: "Try it with today's warnings",
      });
      await expect(popup).toBeVisible();

      /* The popup shrinks to fit once it has measured the window, so its left edge is checked until it settles */
      await expect
        .poll(async () => {
          const [popupBox, demoBox] = await Promise.all([
            popup.boundingBox(),
            demo.boundingBox(),
          ]);
          return popupBox!.x - demoBox!.x;
        })
        .toBeGreaterThanOrEqual(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);

      /* The settings page's website link sits at the end of its header, clear of the logo */
      const header = page
        .getByTitle('FloodWatch settings page')
        .contentFrame()
        .getByRole('banner');
      const [logoBox, linkBox] = await Promise.all([
        header.getByRole('img', { name: 'FloodWatch logo' }).boundingBox(),
        header
          .getByRole('link', { name: "FloodWatch's website" })
          .boundingBox(),
      ]);
      expect(logoBox!.x + logoBox!.width).toBeLessThanOrEqual(linkBox!.x);
    });
  }
});
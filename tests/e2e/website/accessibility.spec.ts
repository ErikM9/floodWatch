import AxeBuilder from '@axe-core/playwright';

import { test, expect } from './support/site';
import { floodItem, fossWarningArea } from '../../support/floodData';

/* The demo frames hold the extension's own pages, which the extension's scans cover */
test('passes the WCAG 2.1 A and AA scans, colour contrast included, with a notification on screen', async ({
  page,
  services,
  popup,
}) => {
  services.floods = [floodItem(fossWarningArea, 2)];
  await page.goto('/');
  await page
    .getByRole('button', { name: 'River Foss at York city centre' })
    .click();
  await popup.getByRole('button', { name: 'Turn ON Alerts' }).click();
  await expect(page.getByRole('alert')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('iframe')
    .analyze();

  expect(results.violations).toEqual([]);
});
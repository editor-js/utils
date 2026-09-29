import { expect, test } from '@playwright/test';
import { openFixture, showPopover } from './utils';

test.describe('fixtures', () => {
  test('menu fixture builds a popover', async ({ page }) => {
    await openFixture(page, 'menu');

    await expect(page.locator('.ce-popover')).toHaveCount(1);
  });

  test('inline fixture builds a popover', async ({ page }) => {
    await showPopover(page, 'inline');

    await expect(page.locator('.ce-popover--inline .ce-popover__container')).toBeVisible();
  });

  test('mobile fixture builds a popover', async ({ page }) => {
    await openFixture(page, 'mobile');

    await expect(page.locator('.ce-popover')).toHaveCount(1);
  });
});

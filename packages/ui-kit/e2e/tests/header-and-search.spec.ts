import { expect, test } from '@playwright/test';
import { hidePopover, showPopover } from './utils';

test.describe('search input', () => {
  test.beforeEach(async ({ page }) => {
    await showPopover(page, 'menu');
  });

  test('is exposed as a named searchbox', async ({ page }) => {
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
  });

  test('is focused and tabbable while the popover is opened', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: 'Search' });

    await expect(search).toBeFocused();
    await expect(search).toHaveAttribute('tabindex', '0');
  });

  test('is not reachable by Tab once the popover is closed', async ({ page }) => {
    await hidePopover(page);

    const search = page.getByRole('searchbox', { name: 'Search' });

    await expect(search).toHaveAttribute('tabindex', '-1');

    await page.getByRole('button', { name: 'Before' }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(search).not.toBeFocused();
  });
});

test.describe('mobile popover header', () => {
  test('back button has an accessible name and returns to the parent list', async ({ page }) => {
    await showPopover(page, 'mobile');

    await page.getByRole('menuitem', { name: 'Has children' }).click();

    await expect(page.getByRole('menuitem', { name: 'Child A' })).toBeVisible();

    const backButton = page.getByRole('button', { name: 'Back' });

    await expect(backButton).toBeVisible();

    await backButton.click();

    await expect(page.getByRole('menuitem', { name: 'Simple Item' })).toBeVisible();
  });

  test('nested view is named after the item it was opened from', async ({ page }) => {
    await showPopover(page, 'mobile');

    await page.getByRole('menuitem', { name: 'Has children' }).click();

    const container = page.locator('.ce-popover__container');
    const labelledBy = await container.getAttribute('aria-labelledby');

    expect(labelledBy).not.toBeNull();
    await expect(page.locator(`#${labelledBy as string}`)).toHaveText('Has children');
  });
});

test.describe('nested desktop popover', () => {
  test('is named after the item it was opened from', async ({ page }) => {
    await showPopover(page, 'menu');

    /** On desktop nested popovers are opened on hover */
    await page.getByRole('menuitem', { name: 'Has children' }).hover();

    await expect(page.getByRole('menu', { name: 'Has children' })).toBeVisible();
  });
});

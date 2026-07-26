import { expect, test } from '@playwright/test';
import { hidePopover, showPopover } from './utils';

test.describe('search announcements', () => {
  test.beforeEach(async ({ page }) => {
    await showPopover(page, 'menu');
  });

  test('reports the number of found items', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search' }).fill('Align');

    await expect(page.getByRole('status').first()).toHaveText('2 results');
  });

  test('uses the singular form when exactly one item matches', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search' }).fill('Bold');

    await expect(page.getByRole('status').first()).toHaveText('1 result');
  });

  test('reports that nothing was found', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search' }).fill('nonexistent item');

    await expect(page.getByRole('status').first()).toHaveText('Nothing found');
  });

  test('collapses a burst of keystrokes into a single announcement instead of one per character', async ({ page }) => {
    const status = page.getByRole('status').first();

    /**
     * Each keystroke would otherwise re-trigger the announcement, restarting the screen reader
     * mid-sentence before it gets to finish reading the previous one
     */
    await page.getByRole('searchbox', { name: 'Search' }).pressSequentially('Align', { delay: 50 });

    await expect(status).toHaveText('');
    await expect(status).toHaveText('2 results');
  });
});

test.describe('confirmation mode', () => {
  test('item name changes to the confirmation title and is announced', async ({ page }) => {
    await showPopover(page, 'menu');

    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByRole('menuitem', { name: 'Are you sure?' })).toBeVisible();
    await expect(page.getByRole('status').first()).toHaveText('Are you sure?');
  });

  test('item name reverts once the popover is reopened', async ({ page }) => {
    await showPopover(page, 'menu');

    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page.getByRole('menuitem', { name: 'Are you sure?' })).toBeVisible();

    await hidePopover(page);

    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeAttached();
  });
});

test.describe('items with children', () => {
  test('advertise and reflect the nested popover state', async ({ page }) => {
    await showPopover(page, 'menu');

    const item = page.getByRole('menuitem', { name: 'Has children' });

    await expect(item).toHaveAttribute('aria-haspopup', 'menu');
    await expect(item).toHaveAttribute('aria-expanded', 'false');

    await item.hover();
    await expect(item).toHaveAttribute('aria-expanded', 'true');

    await page.getByRole('menuitem', { name: 'Simple Item' }).hover();
    await expect(item).toHaveAttribute('aria-expanded', 'false');
  });
});

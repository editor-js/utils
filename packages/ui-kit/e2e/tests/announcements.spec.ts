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

  test('reports that nothing was found', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search' }).fill('nonexistent item');

    await expect(page.getByRole('status').first()).toHaveText('Nothing found');
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

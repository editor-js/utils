import { expect, test } from '@playwright/test';
import { showPopover } from './utils';

test.describe('menu items', () => {
  test.beforeEach(async ({ page }) => {
    await showPopover(page, 'menu');
  });

  test('plain item is exposed as a named menuitem', async ({ page }) => {
    await expect(page.getByRole('menuitem', { name: 'Simple Item' })).toBeVisible();
  });

  test('items with a toggle key are exposed as radios', async ({ page }) => {
    await expect(page.getByRole('menuitemradio', { name: 'Align Left' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('menuitemradio', { name: 'Align Center' })).toHaveAttribute('aria-checked', 'false');
  });

  test('item with toggle set to true is exposed as a checkbox', async ({ page }) => {
    await expect(page.getByRole('menuitemcheckbox', { name: 'Bold' })).toHaveAttribute('aria-checked', 'false');
  });

  test('disabled item is exposed as disabled', async ({ page }) => {
    await expect(page.getByRole('menuitem', { name: 'Disabled Item' })).toHaveAttribute('aria-disabled', 'true');
  });

  test('accessible name equals the title, icon is not announced', async ({ page }) => {
    const item = page.getByRole('menuitem', { name: 'Simple Item' });

    await expect(item).toHaveAttribute('aria-label', 'Simple Item');
    await expect(item.locator('.ce-popover-item__icon')).toHaveAttribute('aria-hidden', 'true');
  });

  test('radio group items are wrapped into a group', async ({ page }) => {
    const group = page.getByRole('group');

    await expect(group).toHaveCount(1);
    await expect(group.getByRole('menuitemradio')).toHaveCount(2);
  });
});

test.describe('inline items', () => {
  test.beforeEach(async ({ page }) => {
    await showPopover(page, 'inline');
  });

  test('icon-only item resolves by its accessible name', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Bold',
      exact: true })).toBeVisible();
  });

  test('icon-only item without title is named by its hint', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Italic',
      exact: true })).toBeVisible();
  });

  test('active state is exposed as aria-pressed', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Bold',
      exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Italic',
      exact: true })).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('containers', () => {
  test('desktop popover items container is a menu', async ({ page }) => {
    await showPopover(page, 'menu');

    const menu = page.getByRole('menu');

    await expect(menu).toHaveCount(1);
    await expect(menu.getByRole('menuitem', { name: 'Simple Item' })).toBeVisible();
  });

  test('search input is not a part of the menu', async ({ page }) => {
    await showPopover(page, 'menu');

    await expect(page.getByRole('menu').locator('input')).toHaveCount(0);
    await expect(page.locator('.ce-popover__search input')).toHaveCount(1);
  });

  test('inline popover items container is a toolbar', async ({ page }) => {
    await showPopover(page, 'inline');

    const toolbar = page.getByRole('toolbar');

    await expect(toolbar).toHaveCount(1);
    await expect(toolbar.getByRole('button', { name: 'Bold',
      exact: true })).toBeVisible();
  });
});

test.describe('active state stays in sync', () => {
  test('clicking a radio item moves the checked state within the group', async ({ page }) => {
    await showPopover(page, 'menu');

    await page.getByRole('menuitemradio', { name: 'Align Center' }).click();

    await expect(page.getByRole('menuitemradio', { name: 'Align Center' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('menuitemradio', { name: 'Align Left' })).toHaveAttribute('aria-checked', 'false');
  });

  test('clicking a checkbox item toggles the checked state', async ({ page }) => {
    await showPopover(page, 'menu');

    const item = page.getByRole('menuitemcheckbox', { name: 'Bold' });

    await item.click();
    await expect(item).toHaveAttribute('aria-checked', 'true');

    await item.click();
    await expect(item).toHaveAttribute('aria-checked', 'false');
  });
});

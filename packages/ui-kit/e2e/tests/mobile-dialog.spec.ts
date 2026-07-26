import { expect, test } from '@playwright/test';
import { openFixture, showPopover } from './utils';

test.describe('mobile popover', () => {
  test('is exposed as a modal dialog', async ({ page }) => {
    await showPopover(page, 'mobile');

    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('moves focus inside on open and keeps Tab within the dialog', async ({ page }) => {
    await showPopover(page, 'mobile');

    await expect(page.getByRole('menuitem', { name: 'Simple Item' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('menuitem', { name: 'Has children' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('menuitem', { name: 'Simple Item' })).toBeFocused();
  });

  test('Escape closes the dialog and returns focus to the trigger', async ({ page }) => {
    await openFixture(page, 'mobile');

    /** Opened from the keyboard: Safari does not focus a button on click */
    const trigger = page.getByRole('button', { name: 'Open mobile popover' });

    await trigger.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Open mobile popover' })).toBeFocused();
  });

  test('items are not tabbable while the popover is closed', async ({ page }) => {
    await openFixture(page, 'mobile');

    const tabbable = await page.locator('.ce-popover-item').evaluateAll(items =>
      items.filter(item => item.getAttribute('tabindex') !== '-1').length);

    expect(tabbable).toBe(0);
  });

  test('separator is not tabbable while the popover is open', async ({ page }) => {
    await showPopover(page, 'mobile');

    const separator = page.getByRole('separator');

    await expect(separator).toHaveAttribute('tabindex', '-1');
  });

  test('Enter drills into a nested item', async ({ page }) => {
    await showPopover(page, 'mobile');

    await page.getByRole('menuitem', { name: 'Has children' }).focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('menuitem', { name: 'Child A' })).toBeVisible();
  });
});

test.describe('secondary item types', () => {
  test('separator is exposed as a separator', async ({ page }) => {
    await showPopover(page, 'menu');

    await expect(page.getByRole('separator')).toHaveCount(1);
  });

  test('html item wrapper does not break the menu structure', async ({ page }) => {
    await showPopover(page, 'menu');

    await expect(page.locator('.ce-popover-item-html')).toHaveAttribute('role', 'none');
    await expect(page.getByRole('menu').getByRole('button', { name: 'Custom control' })).toBeVisible();
  });

  test('a native control inside a never-opened popover is not tabbable', async ({ page }) => {
    /**
     * Unlike other item types, an html item's native controls (buttons, inputs) are tabbable by
     * the browser's own default, so they need this checked before the popover is ever shown -
     * that's the only point where the rest of the items get their tabindex stripped
     */
    await openFixture(page, 'menu');

    await expect(page.getByRole('button', { name: 'Custom control' })).toHaveAttribute('tabindex', '-1');
  });

  test('mobile dialog makes an html item\'s native control reachable by Tab, not its wrapper', async ({ page }) => {
    /**
     * The mobile dialog used to toggle tabindex on the html item's role="none" wrapper instead
     * of its actual control, leaving the control permanently untabbable and breaking the Tab loop
     */
    await showPopover(page, 'mobileHtmlItem');

    const control = page.getByRole('button', { name: 'Custom control' });

    await expect(page.getByRole('menuitem', { name: 'Simple item' })).toBeFocused();
    await expect(control).toHaveAttribute('tabindex', '0');

    await page.keyboard.press('Tab');
    await expect(control).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('menuitem', { name: 'Simple item' })).toBeFocused();
  });

  test('filtered out items are excluded from the menu', async ({ page }) => {
    await showPopover(page, 'menu');

    await page.getByRole('searchbox', { name: 'Search' }).fill('Align');

    await expect(page.getByRole('menuitem')).toHaveCount(0);
    await expect(page.getByRole('menuitemradio')).toHaveCount(2);
    await expect(page.locator('.ce-popover-item[data-item-name="simple"]')).toHaveAttribute('hidden', '');
  });
});

test.describe('hints', () => {
  test('hint is referenced by its item', async ({ page }) => {
    await showPopover(page, 'inline');

    const italic = page.getByRole('button', { name: 'Italic',
      exact: true });

    await expect(italic).toHaveAttribute('aria-describedby', /.+/);
  });

  test('hint is shown once the item gets keyboard focus', async ({ page }) => {
    await showPopover(page, 'menu');

    const item = page.getByRole('menuitemcheckbox', { name: 'Bold' });
    const describedBy = await item.getAttribute('aria-describedby');

    expect(describedBy).not.toBeNull();

    /** Bold is the fourth item of the menu */
    const boldItemPosition = 4;

    for (let i = 0; i < boldItemPosition; i++) {
      await page.keyboard.press('ArrowDown');
    }

    await expect(item).toBeFocused();
    await expect(page.locator(`#${describedBy as string}`)).toBeVisible();
  });
});

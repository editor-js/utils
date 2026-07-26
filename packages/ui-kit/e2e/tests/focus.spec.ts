import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { activatedItems, hidePopover, showPopover } from './utils';

/**
 * Returns the accessible name of the currently focused element
 * @param page - playwright page object
 */
async function focusedName(page: Page): Promise<string | null> {
  return page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? null);
}

test.describe('keyboard navigation moves real focus', () => {
  test.beforeEach(async ({ page }) => {
    await showPopover(page, 'menu');
  });

  test('arrow down focuses the first item and makes it the only tabbable one', async ({ page }) => {
    await page.keyboard.press('ArrowDown');

    const firstItem = page.getByRole('menuitem', { name: 'Simple Item' });

    await expect(firstItem).toBeFocused();
    await expect(firstItem).toHaveAttribute('tabindex', '0');

    const tabIndexes = await page.locator('.ce-popover-item').evaluateAll(items =>
      items.filter(item => item.getAttribute('tabindex') === '0').length);

    expect(tabIndexes).toBe(1);
  });

  test('arrow down twice moves focus to the second item', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    await expect(page.getByRole('menuitemradio', { name: 'Align Left' })).toBeFocused();
    expect(await focusedName(page)).toBe('Align Left');
  });

  test('enter activates the focused item', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    expect(await activatedItems(page)).toContain('simple');
  });

  test('items of a closed popover are not tabbable', async ({ page }) => {
    await hidePopover(page);

    const tabbable = await page.locator('.ce-popover-item').evaluateAll(items =>
      items.filter(item => item.getAttribute('tabindex') !== '-1').length);

    expect(tabbable).toBe(0);
  });
});

test.describe('inline popover keyboard navigation', () => {
  test('arrow down moves focus between toolbar buttons', async ({ page }) => {
    await showPopover(page, 'inline');

    await page.keyboard.press('ArrowDown');

    await expect(page.getByRole('button', { name: 'Bold',
      exact: true })).toBeFocused();
  });

  test('click still activates an item', async ({ page }) => {
    await showPopover(page, 'inline');

    await page.getByRole('button', { name: 'Italic',
      exact: true }).click();

    expect(await activatedItems(page)).toContain('italic');
  });
});

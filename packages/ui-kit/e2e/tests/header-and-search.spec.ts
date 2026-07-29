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

    /**
     * The closed popover is hidden from assistive tech (visibility: hidden), so getByRole()
     * can no longer find the search field - this reaches it via its CSS class instead, since
     * checking tabindex on a DOM node doesn't require it to be exposed to accessibility
     */
    const search = page.locator('.cdx-search-field__input');

    await expect(search).toHaveAttribute('tabindex', '-1');

    await page.getByRole('button', { name: 'Before' }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(search).not.toBeFocused();
  });

  test('Tab still reaches the filtered results after typing a query', async ({ page }) => {
    /**
     * Filtering used to reactivate the Flipper without restoring any item's roving tabindex,
     * so Tab from the search field landed nowhere until an arrow key was pressed first
     */
    const search = page.getByRole('searchbox', { name: 'Search' });

    await search.fill('Align');

    const firstResult = page.getByRole('menuitemradio', { name: 'Align Left' });

    await expect(firstResult).toHaveAttribute('tabindex', '0');
    await expect(search).toBeFocused();

    await page.keyboard.press('Tab');

    await expect(firstResult).toBeFocused();
  });

  test('arrow navigation after clicking a result stays within the matches', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search' }).fill('Align');

    await expect(page.getByRole('menuitemradio')).toHaveCount(2);

    /** A toggle item, so the popover stays open after the click */
    await page.getByRole('menuitemradio', { name: 'Align Center' }).click();

    /**
     * Clicking gives the item the real focus, which moves the Flipper cursor to it. The cursor
     * has to be indexed against the filtered list the Flipper is navigating - handing it the
     * full list would silently put the filtered-out items back into the navigation, and the
     * arrows would then travel through items that are not on screen
     */
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitemradio', { name: 'Align Left' })).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitemradio', { name: 'Align Center' })).toBeFocused();
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

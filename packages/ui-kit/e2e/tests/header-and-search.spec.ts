import { expect, test } from '@playwright/test';
import { addItem, hidePopover, showPopover } from './utils';

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

  test('Shift+Tab from the first item returns to the search field', async ({ page }) => {
    /**
     * The search field is not one of the items the Flipper navigates, so a Tab ring made of
     * the items alone would strand it: once the focus moved into the list there would be no
     * way back to the query the list is filtered by
     */
    const search = page.getByRole('searchbox', { name: 'Search' });

    await page.keyboard.press('Tab');
    await expect(page.getByRole('menuitem', { name: 'Simple Item' })).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(search).toBeFocused();
  });

  test('Tab from the last item wraps round to the search field', async ({ page }) => {
    /** The html item's control is the last stop of the ring before it comes back round */
    const control = page.getByRole('button', { name: 'Custom control' });

    await control.focus();
    await page.keyboard.press('Tab');

    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeFocused();
  });

  test('Shift+Tab leafs the items backwards instead of leaving the popover', async ({ page }) => {
    /**
     * Flipper.handleTabPress() always read the modifier to pick a direction, but the handler
     * bailed out of every Shift-modified key before reaching it, so Shift+Tab fell through to
     * the browser and dropped the user out of the list they were half way through
     */
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('menuitemradio', { name: 'Align Left' })).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('menuitem', { name: 'Simple Item' })).toBeFocused();
  });

  test('an item added while a query is typed is filtered by that query', async ({ page }) => {
    /**
     * Changing the item list leaves the results describing a list that no longer exists: the
     * newcomer used to show up among the matches whether it matched or not, and the announced
     * count went with it
     */
    await page.getByRole('searchbox', { name: 'Search' }).fill('Align');
    await expect(page.getByRole('menuitemradio')).toHaveCount(2);

    await addItem(page, {
      title: 'Align Right',
      name: 'align-right',
      toggle: 'align',
    });

    const matchesAfterAdding = 3;

    await expect(page.getByRole('menuitemradio')).toHaveCount(matchesAfterAdding);
    await expect(page.getByRole('status').first()).toHaveText(`${matchesAfterAdding} results`);

    await addItem(page, {
      title: 'Strikethrough',
      name: 'strike',
    });

    /** Does not match, so it stays out of the results rather than joining them */
    await expect(page.getByRole('menuitem', { name: 'Strikethrough' })).toHaveCount(0);
    await expect(page.locator('[data-item-name="strike"]')).toBeHidden();
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

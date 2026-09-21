import { expect, test } from '@playwright/test';
import { addItem, hidePopover, removeItemByName, showPopover } from './utils';

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

  test('explicit ariaLabel and role params override the derived ones', async ({ page }) => {
    const item = page.getByRole('button', { name: 'Custom accessible name' });

    await expect(item).toBeVisible();
    await expect(item).toHaveText('Visible title');
    await expect(page.getByRole('menuitem', { name: 'Visible title' })).toHaveCount(0);
  });

  test('radio group items are wrapped into a group', async ({ page }) => {
    const group = page.getByRole('group');

    await expect(group).toHaveCount(1);
    await expect(group.getByRole('menuitemradio')).toHaveCount(2);
  });

  test('removing the item the keyboard is on keeps the list usable', async ({ page }) => {
    /**
     * Re-seeding the Flipper without dropping its cursor first left it pointing past the end
     * of the now shorter list, and DomIterator indexes that array straight out - the next
     * arrow press, or simply closing the popover, threw. Taking the container apart to lay it
     * out again also dropped the focus onto the document body
     */
    const errors: string[] = [];

    page.on('pageerror', error => errors.push(error.message));

    /** Walk the cursor onto the last stop of the list, the html item's control */
    const lastItemPosition = 9;

    for (let i = 0; i < lastItemPosition; i++) {
      await page.keyboard.press('ArrowDown');
    }

    const last = page.getByRole('button', { name: 'Custom control' });

    await expect(last).toBeFocused();

    await removeItemByName(page, 'simple');

    await expect(last).toBeFocused();

    /** The cursor came back with the focus, so the arrows resume from there and wrap round */
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitemradio', { name: 'Align Left' })).toBeFocused();

    expect(errors).toEqual([]);
  });

  test('items added to the opened popover are laid out and navigable right away', async ({ page }) => {
    /**
     * Adding used to append the element straight to the container, bypassing the layout pass:
     * the item skipped the role="group" wrapping and stayed out of the keyboard navigation
     * until the popover was closed and opened again
     */
    await addItem(page, {
      title: 'Align Right',
      name: 'align-right',
      toggle: 'extra',
    });
    await addItem(page, {
      title: 'Align Justify',
      name: 'align-justify',
      toggle: 'extra',
    });

    /** Appended next to each other with the same toggle key, so they form a group of their own */
    const groupsCount = 2;

    await expect(page.getByRole('group')).toHaveCount(groupsCount);

    /** ArrowUp wraps the navigation round to the last item, which is the one just added */
    await page.keyboard.press('ArrowUp');

    await expect(page.getByRole('menuitemradio', { name: 'Align Justify' })).toBeFocused();
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

test.describe('item states', () => {
  test('an inline button without an on/off state is not exposed as a toggle', async ({ page }) => {
    await showPopover(page, 'inline');

    await expect(page.getByRole('button', { name: 'Link',
      exact: true })).not.toHaveAttribute('aria-pressed');
    await expect(page.getByRole('button', { name: 'Italic',
      exact: true })).toHaveAttribute('aria-pressed', 'false');
  });

  test('the toggled state survives leaving confirmation mode', async ({ page }) => {
    await showPopover(page, 'confirmationToggle');

    /** The click toggles the item on and brings it into confirmation mode */
    await page.getByRole('menuitemcheckbox', { name: 'Pin' }).click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Sure?' })).toHaveAttribute('aria-checked', 'true');

    /** Closing resets the confirmation mode, which used to reset aria-checked to the initial params */
    await hidePopover(page);

    const item = page.locator('[data-item-name="pin"]');

    await expect(item).toHaveClass(/ce-popover-item--active/);
    await expect(item).toHaveAttribute('aria-checked', 'true');
  });

  test('items filtered out by the search are hidden, not only styled away', async ({ page }) => {
    await showPopover(page, 'menu');

    await page.getByRole('searchbox', { name: 'Search' }).fill('Align');

    await expect(page.locator('[data-item-name="simple"]')).toHaveJSProperty('hidden', true);
    await expect(page.locator('[data-item-name="align-left"]')).toHaveJSProperty('hidden', false);
  });
});

test.describe('default accessible names', () => {
  test('a popover without a label of its own is still named', async ({ page }) => {
    await showPopover(page, 'menu');

    await expect(page.getByRole('menu', { name: 'Menu' })).toBeVisible();
  });

  test('an inline popover without a label of its own is named as a toolbar', async ({ page }) => {
    await showPopover(page, 'inline');

    await expect(page.getByRole('toolbar', { name: 'Toolbar' })).toBeVisible();
  });
});

test.describe('html item popup state', () => {
  test('an html item with children advertises the submenu on its control, not on the wrapper', async ({ page }) => {
    await showPopover(page, 'htmlItems');

    const control = page.getByRole('button', { name: 'More' });

    await expect(control).toHaveAttribute('aria-haspopup', 'menu');
    await expect(control).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-item-name="html-parent"]')).not.toHaveAttribute('aria-haspopup');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');

    await expect(control).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('hover styles', () => {
  test('items show the pointer cursor on hover', async ({ page }) => {
    /** Used to be dropped with the whole @media (--can-hover) block, left unresolved in the output */
    await showPopover(page, 'menu');

    const item = page.getByRole('menuitem', { name: 'Simple Item' });

    await item.hover();

    expect(await item.evaluate(element => getComputedStyle(element).cursor)).toBe('pointer');
  });
});

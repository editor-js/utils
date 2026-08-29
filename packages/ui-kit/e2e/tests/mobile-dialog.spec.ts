import { expect, test } from '@playwright/test';
import { callShow, destroyPopover, hidePopover, openFixture, showPopover, showPopoverWithKeyboard } from './utils';

test.describe('mobile popover', () => {
  test('is exposed as a modal dialog', async ({ page }) => {
    await showPopover(page, 'mobile');

    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('moves focus inside on open and navigates the menu with the arrows', async ({ page }) => {
    await showPopover(page, 'mobile');

    await expect(page.getByRole('menuitem', { name: 'Simple Item' })).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Has children' })).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Simple Item' })).toBeFocused();
  });

  test('menu is a single Tab stop and Tab does not leave the dialog', async ({ page }) => {
    await showPopover(page, 'mobile');

    /**
     * The item list is a menu, so it takes part in the tab sequence as a whole: only the item
     * the user is currently on is tabbable, the arrows move between the items. Tab has nothing
     * else to reach in this dialog, so it stays where it is rather than leaving for the page
     */
    const item = page.getByRole('menuitem', { name: 'Simple Item' });

    await expect(item).toHaveAttribute('tabindex', '0');
    await expect(page.getByRole('menuitem', { name: 'Has children' })).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('Tab');
    await expect(item).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(item).toBeFocused();
  });

  test('the roving tabindex follows the arrows', async ({ page }) => {
    await showPopover(page, 'mobile');

    await page.keyboard.press('ArrowDown');

    await expect(page.getByRole('menuitem', { name: 'Has children' })).toHaveAttribute('tabindex', '0');
    await expect(page.getByRole('menuitem', { name: 'Simple Item' })).toHaveAttribute('tabindex', '-1');
  });

  test('keeps the focus that moved out of the dialog while it was open', async ({ page }) => {
    await openFixture(page, 'mobile');

    const trigger = page.getByRole('button', { name: 'Open mobile popover' });

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    /**
     * Focus has been moved out of the popover by something else, so closing it must not yank
     * the focus back to whatever opened it
     */
    const outside = page.getByRole('button', { name: 'Before' });

    await outside.focus();
    await hidePopover(page);

    await expect(outside).toBeFocused();
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

  test('separator is not focusable while the popover is open', async ({ page }) => {
    await showPopover(page, 'mobile');

    const separator = page.getByRole('separator');

    /**
     * Not even with tabindex="-1": a focusable separator is a splitter, which requires a value
     */
    await expect(separator).not.toHaveAttribute('tabindex');
  });

  test('Tab moves between the back button and the menu once nested', async ({ page }) => {
    await showPopover(page, 'mobile');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    /**
     * The menu counts as one tab stop, so the nested panel has exactly two: the back button
     * that leaves this level, and whichever item the arrows are currently on
     */
    const back = page.getByRole('button', { name: 'Back' });
    const child = page.getByRole('menuitem', { name: 'Child A' });

    await expect(child).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(back).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(child).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(back).toBeFocused();
  });

  test('a nested level with isFlippable false leaves its keys to its own controls', async ({ page }) => {
    /**
     * Nested levels render into the same panel as the root one, so the Flipper that navigates
     * the root list would carry on claiming the arrows and Enter here too - and an item built
     * around a text input needs both for itself
     */
    await showPopover(page, 'mobileNestedInput');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const input = page.getByRole('textbox', { name: 'Nested input' });

    await expect(input).toBeVisible();

    await input.fill('editorjs');
    await page.keyboard.press('ArrowDown');

    /** The Flipper would have moved the focus off to the next item by now */
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('editorjs');
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

    /**
     * The closed popover is hidden from assistive tech (visibility: hidden), so getByRole()
     * can no longer find it - this reaches it via its CSS class instead, since checking
     * tabindex on a DOM node doesn't require it to be exposed to accessibility
     */
    await expect(page.locator('.ce-popover-item-html button')).toHaveAttribute('tabindex', '-1');
  });

  test('mobile dialog navigates to an html item\'s native control, not to its wrapper', async ({ page }) => {
    /**
     * The mobile dialog used to toggle tabindex on the html item's role="none" wrapper instead
     * of its actual control, leaving the control permanently unreachable from the keyboard
     */
    await showPopover(page, 'mobileHtmlItem');

    const control = page.getByRole('button', { name: 'Custom control' });

    await expect(page.getByRole('menuitem', { name: 'Simple item' })).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(control).toBeFocused();
    await expect(control).toHaveAttribute('tabindex', '0');

    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Simple item' })).toBeFocused();
  });

  test('filtered out items are excluded from the menu', async ({ page }) => {
    await showPopover(page, 'menu');

    await page.getByRole('searchbox', { name: 'Search' }).fill('Align');

    await expect(page.getByRole('menuitem')).toHaveCount(0);
    await expect(page.getByRole('menuitemradio')).toHaveCount(2);
    /** The item is still in the DOM, just hidden - and hence out of the accessibility tree */
    await expect(page.locator('.ce-popover-item[data-item-name="simple"]')).toBeHidden();
  });
});

test.describe('hints', () => {
  test('hint is referenced by its item', async ({ page }) => {
    await showPopover(page, 'inline');

    const italic = page.getByRole('button', { name: 'Italic',
      exact: true });

    await expect(italic).toHaveAttribute('aria-describedby', /.+/);
  });

  test('html item hint describes its control and is shown once that control gets focus', async ({ page }) => {
    /**
     * An html item's root is a role="none" wrapper the focus never lands on, so the hint used
     * to be tied to an element that never fires focus - it was hover-only for such items
     */
    await showPopover(page, 'menu');

    const control = page.getByRole('button', { name: 'Custom control' });
    const describedBy = await control.getAttribute('aria-describedby');

    expect(describedBy).not.toBeNull();

    await control.focus();

    await expect(page.locator(`#${describedBy as string}`)).toBeVisible();
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

test.describe('mobile dialog focus edge cases', () => {
  test('a flippable: false dialog still moves the focus inside on open', async ({ page }) => {
    await showPopover(page, 'mobilePlain');

    await expect(page.getByRole('menuitem', { name: 'First' })).toBeFocused();
  });

  test('a dialog with nothing focusable holds the focus itself and keeps it on Tab', async ({ page }) => {
    await showPopover(page, 'mobileEmpty');

    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(dialog).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(dialog).toBeFocused();
  });

  test('show() on an opened dialog keeps the original opener to return the focus to', async ({ page }) => {
    await showPopoverWithKeyboard(page, 'mobile');

    /** The first item has the focus now, it must not become the element to return it to */
    await expect(page.getByRole('menuitem', { name: 'Simple Item' })).toBeFocused();

    await callShow(page);
    await page.keyboard.press('Escape');

    await expect(page.getByRole('button', { name: 'Open mobile popover' })).toBeFocused();
  });

  test('destroying an opened dialog stops its keyboard handling', async ({ page }) => {
    await showPopover(page, 'mobile');

    /** The Flipper claims ArrowDown with preventDefault() for as long as it stays activated */
    const isArrowDownClaimed = async (): Promise<boolean> => page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        keyCode: 40,
        bubbles: true,
        cancelable: true,
      });

      document.body.dispatchEvent(event);

      return event.defaultPrevented;
    });

    expect(await isArrowDownClaimed()).toBe(true);

    await destroyPopover(page);

    expect(await isArrowDownClaimed()).toBe(false);
  });
});

test.describe('mobile dialog name', () => {
  test('is named even without a label of its own', async ({ page }) => {
    await showPopover(page, 'mobile');

    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
  });
});

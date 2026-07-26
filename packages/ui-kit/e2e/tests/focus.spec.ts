import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { activatedItems, hidePopover, isPopoverShown, openFixture, showPopover } from './utils';

/**
 * Returns the accessible name of the currently focused element
 * @param page - playwright page object
 */
async function focusedName(page: Page): Promise<string | null> {
  return page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? null);
}

/**
 * Offsets of the word 'bold' inside the text of the inline-selection fixture
 */
const BOLD_WORD_RANGE = {
  start: 5,
  end: 9,
};

/**
 * Popover instance the inline-selection fixture exposes
 */
interface PopoverShowWindow {
  /**
   * Popover under test
   */
  popover: {
    /**
     * Opens the popover
     */
    show: () => void;
  };
}

/**
 * Selects a word inside the editable element of the fixture and opens the inline popover for it
 * @param page - playwright page object
 */
async function selectWordAndShowPopover(page: Page): Promise<void> {
  await page.evaluate(({ start, end }) => {
    const node = (document.getElementById('editable') as HTMLElement).firstChild as Text;
    const range = document.createRange();

    range.setStart(node, start);
    range.setEnd(node, end);

    const selection = window.getSelection() as Selection;

    selection.removeAllRanges();
    selection.addRange(range);

    (window as unknown as PopoverShowWindow).popover.show();
  }, BOLD_WORD_RANGE);
}

/**
 * Returns the state of the current document selection
 * @param page - playwright page object
 */
// eslint-disable-next-line jsdoc/require-jsdoc -- JSDoc doesn't understand it's a type, not an object
async function selectionState(page: Page): Promise<{ rangeCount: number; text: string }> {
  return page.evaluate(() => {
    const selection = window.getSelection() as Selection;

    return {
      rangeCount: selection.rangeCount,
      text: selection.toString(),
    };
  });
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

  test('isShown reflects whether the popover is open', async ({ page }) => {
    expect(await isPopoverShown(page)).toBe(true);

    await hidePopover(page);

    expect(await isPopoverShown(page)).toBe(false);
  });
});

test.describe('focus restoration on close', () => {
  test('Escape returns focus to the button that opened the popover', async ({ page }) => {
    await openFixture(page, 'menu');

    /** Opened from the keyboard: Safari does not focus a button on click */
    const trigger = page.getByRole('button', { name: 'Open menu' });

    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Simple Item' })).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(trigger).toBeFocused();
  });
});

test.describe('nested submenu keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await showPopover(page, 'menu');
  });

  /**
   * 'Has children' is the sixth flippable item in the menu fixture (after Simple Item, Align
   * Left, Align Center, Bold and Disabled Item), and search starts focused, so it takes six
   * ArrowDown presses to reach it by real keyboard navigation
   */
  const PRESSES_TO_REACH_ITEM_WITH_CHILDREN = 6;

  /**
   * Moves the Flipper's own cursor to the 'Has children' item via arrow keys (rather than
   * focusing it directly), so that Flipper's Enter-triggered click acts on the right item,
   * then opens its submenu with Enter as a real keyboard user would
   * @param page - playwright page object
   */
  async function openSubmenuFromKeyboard(page: Page): Promise<void> {
    for (let i = 0; i < PRESSES_TO_REACH_ITEM_WITH_CHILDREN; i++) {
      await page.keyboard.press('ArrowDown');
    }

    await expect(page.getByRole('menuitem', { name: 'Has children' })).toBeFocused();

    await page.keyboard.press('Enter');
  }

  test('Escape backs out of an open submenu instead of trapping focus', async ({ page }) => {
    await openSubmenuFromKeyboard(page);

    await expect(page.getByRole('menuitem', { name: 'Child A' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('menuitem', { name: 'Child A' })).not.toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Has children' })).toBeFocused();
    await expect(page.getByRole('menu').first()).toBeVisible();
  });

  test('Escape closes the whole popover once there is nothing nested open', async ({ page }) => {
    await page.keyboard.press('Escape');

    await expect(page.getByRole('menu').first()).not.toBeVisible();
  });

  test('ArrowRight opens the submenu of the focused item', async ({ page }) => {
    for (let i = 0; i < PRESSES_TO_REACH_ITEM_WITH_CHILDREN; i++) {
      await page.keyboard.press('ArrowDown');
    }

    await page.keyboard.press('ArrowRight');

    await expect(page.getByRole('menuitem', { name: 'Child A' })).toBeVisible();
  });

  test('ArrowLeft backs out of the submenu and refocuses the trigger item', async ({ page }) => {
    await openSubmenuFromKeyboard(page);

    /** Move into the submenu itself, as ArrowDown inside it does today */
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Child A' })).toBeFocused();

    await page.keyboard.press('ArrowLeft');

    await expect(page.getByRole('menuitem', { name: 'Child A' })).not.toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Has children' })).toBeFocused();
  });
});

test.describe('nested popover with a custom focus target', () => {
  test('onOpen focuses its element on a keyboard-triggered open, not just on hover', async ({ page }) => {
    await showPopover(page, 'nestedInput');

    /** 'Has children' is the second flippable item in this fixture (no search here) */
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Has children' })).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page.getByRole('textbox', { name: 'Nested input' })).toBeFocused();
  });
});

test.describe('flippable: false popover', () => {
  test.beforeEach(async ({ page }) => {
    await showPopover(page, 'plainMenu');
  });

  test('every item is individually reachable by Tab', async ({ page }) => {
    const copy = page.getByRole('menuitem', { name: 'Copy' });
    const cut = page.getByRole('menuitem', { name: 'Cut' });
    const paste = page.getByRole('menuitem', { name: 'Paste' });

    await expect(copy).toHaveAttribute('tabindex', '0');
    await expect(cut).toHaveAttribute('tabindex', '0');
    await expect(paste).toHaveAttribute('tabindex', '0');

    /** Focus the trigger itself, since it sits between 'Before' and the popover items in the DOM */
    await page.getByRole('button', { name: 'Open menu' }).focus();
    await page.keyboard.press('Tab');
    await expect(copy).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(cut).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(paste).toBeFocused();
  });

  test('Enter activates the focused item', async ({ page }) => {
    await page.getByRole('menuitem', { name: 'Cut' }).focus();
    await page.keyboard.press('Enter');

    expect(await activatedItems(page)).toContain('cut');
  });

  test('activating an item that closes the popover returns focus to the trigger', async ({ page }) => {
    /** Re-open from the keyboard: Safari does not focus a button on click, and show() re-captures the element to restore focus to whenever it runs */
    const trigger = page.getByRole('button', { name: 'Open menu' });

    await trigger.focus();
    await page.keyboard.press('Enter');

    await page.getByRole('menuitem', { name: 'Cut' }).focus();
    await page.keyboard.press('Enter');

    await expect(trigger).toBeFocused();
  });

  test('Space activates the focused item', async ({ page }) => {
    await page.getByRole('menuitem', { name: 'Paste' }).focus();
    await page.keyboard.press('Space');

    expect(await activatedItems(page)).toContain('paste');
  });

  test('clicking outside closes the popover', async ({ page }) => {
    await page.getByRole('button', { name: 'Before' }).click();

    await expect(page.getByRole('menu')).not.toBeVisible();
  });
});

test.describe('inline popover keyboard navigation', () => {
  test('arrow down highlights a toolbar button without taking the focus', async ({ page }) => {
    await showPopover(page, 'inline');

    await page.keyboard.press('ArrowDown');

    const bold = page.getByRole('button', { name: 'Bold',
      exact: true });

    await expect(bold).toHaveClass(/ce-popover-item--focused/);
    await expect(bold).not.toBeFocused();
  });

  /**
   * Safari drops the text selection once the focus moves to a button, which would break
   * applying inline tools with the keyboard
   */
  test('selection of the formatted text survives keyboard navigation', async ({ page }) => {
    await openFixture(page, 'inlineSelection');

    await selectWordAndShowPopover(page);

    await expect
      .poll(async () => selectionState(page))
      .toEqual({ rangeCount: 1,
        text: 'bold' });

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    expect(await selectionState(page)).toEqual({ rangeCount: 1,
      text: 'bold' });
  });

  /**
   * The popover never moves real focus here (see the test above), so a screen reader has no
   * other way to learn which button is highlighted unless the consumer wires PopoverEvent
   * .ActiveDescendantChanged up to aria-activedescendant on whichever element holds real focus
   */
  test('aria-activedescendant on the editable tracks the highlighted item', async ({ page }) => {
    await openFixture(page, 'inlineSelection');

    await selectWordAndShowPopover(page);

    const editable = page.locator('#editable');

    await expect(editable).not.toHaveAttribute('aria-activedescendant');

    await page.keyboard.press('ArrowDown');

    const bold = page.getByRole('button', { name: 'Bold',
      exact: true });
    const boldId = await bold.getAttribute('id');

    expect(boldId).not.toBeNull();
    await expect(editable).toHaveAttribute('aria-activedescendant', boldId as string);

    await page.keyboard.press('ArrowDown');

    const italic = page.getByRole('button', { name: 'Italic',
      exact: true });
    const italicId = await italic.getAttribute('id');

    expect(italicId).not.toBeNull();
    expect(italicId).not.toBe(boldId);
    await expect(editable).toHaveAttribute('aria-activedescendant', italicId as string);

    await hidePopover(page);

    await expect(editable).not.toHaveAttribute('aria-activedescendant');
  });

  test('click still activates an item', async ({ page }) => {
    await showPopover(page, 'inline');

    await page.getByRole('button', { name: 'Italic',
      exact: true }).click();

    expect(await activatedItems(page)).toContain('italic');
  });

  test('Tab moves focus into the toolbar and through each of its buttons', async ({ page }) => {
    await showPopover(page, 'inline');

    const bold = page.getByRole('button', { name: 'Bold',
      exact: true });
    const italic = page.getByRole('button', { name: 'Italic',
      exact: true });

    /** Focus the trigger itself, since it sits between 'Before' and the popover items in the DOM */
    await page.getByRole('button', { name: 'Open inline toolbar' }).focus();
    await page.keyboard.press('Tab');
    await expect(bold).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(italic).toBeFocused();
  });
});

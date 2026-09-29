import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { accessibleTreeNames, activatedItems, activeDescendants, callShow, hidePopover, isPopoverShown, openFixture, showPopover, showPopoverWithKeyboard } from './utils';

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

  test('a closed popover is hidden from assistive tech, not just visually collapsed', async ({ page }) => {
    const popover = page.locator('.ce-popover');
    const menu = page.getByRole('menu');
    const item = page.getByRole('menuitem', { name: 'Simple Item' });

    /**
     * The closed state is opacity/max-height driven so the open animation has something to
     * transition from, which does not remove the element from the accessibility tree on its
     * own - a screen reader's virtual cursor could still land on menu items that are invisible
     * and unclickable. visibility: hidden is what actually excludes it from assistive tech
     * (inert is toggled alongside it too, but only covers focus/tab order: dynamically toggling
     * it was not enough on its own to update Safari/VoiceOver's accessibility tree)
     */
    await expect(popover).toHaveJSProperty('inert', false);
    await expect(menu).toBeVisible();
    await expect(item).toBeVisible();

    await hidePopover(page);

    await expect(popover).toHaveJSProperty('inert', true);
    await expect(menu).toHaveCount(0);
    await expect(item).toHaveCount(0);

    await page.getByRole('button', { name: /^Open/ }).click();

    await expect(popover).toHaveJSProperty('inert', false);
    await expect(menu).toBeVisible();
    await expect(item).toBeVisible();
  });

  test('a closed popover is out of the real accessibility tree, not just Playwright\'s role computation', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'reading the real accessibility tree needs a CDP session, which only Chromium exposes');

    /**
     * getByRole() computes roles from the DOM/CSS itself, so it is not proof a screen reader
     * would agree - this reads the tree via CDP instead, the same one a screen reader consumes
     */
    expect(await accessibleTreeNames(page, context)).toContain('Simple Item');

    await hidePopover(page);

    expect(await accessibleTreeNames(page, context)).not.toContain('Simple Item');
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

  test('opening a submenu moves the focus into it', async ({ page }) => {
    await openSubmenuFromKeyboard(page);

    /**
     * The focus has to follow, otherwise a screen reader announces nothing about the submenu
     * that has just opened, and the arrows can not act on it while the focus is still outside
     */
    await expect(page.getByRole('menuitem', { name: 'Child A' })).toBeFocused();
  });

  test('ArrowLeft backs out of the submenu right after it was opened', async ({ page }) => {
    await openSubmenuFromKeyboard(page);

    await page.keyboard.press('ArrowLeft');

    await expect(page.getByRole('menuitem', { name: 'Child A' })).not.toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Has children' })).toBeFocused();
  });

  test('ArrowLeft backs out of the submenu and refocuses the trigger item', async ({ page }) => {
    await openSubmenuFromKeyboard(page);

    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Child B' })).toBeFocused();

    await page.keyboard.press('ArrowLeft');

    await expect(page.getByRole('menuitem', { name: 'Child A' })).not.toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Has children' })).toBeFocused();
  });

  test('closing a submenu restores the highlight and the tab stop of the parent menu', async ({ page }) => {
    await openSubmenuFromKeyboard(page);
    await page.keyboard.press('ArrowLeft');

    const triggerItem = page.getByRole('menuitem', { name: 'Has children' });

    /**
     * Focusing the trigger item is not enough on its own: the Flipper drops the cursor and
     * every item's tabindex when it hands the keyboard over to the submenu. Without restoring
     * them the item would hold the focus with no --focused class marking it (the default focus
     * ring is suppressed, so the focus would be invisible), and the menu would be left without
     * a single tab stop to be re-entered by
     */
    await expect(triggerItem).toHaveClass(/ce-popover-item--focused/);
    await expect(triggerItem).toHaveAttribute('tabindex', '0');

    const tabbable = await page.locator('.ce-popover-item').evaluateAll(items =>
      items.filter(item => item.getAttribute('tabindex') === '0').length);

    expect(tabbable).toBe(1);
  });

  test('arrow navigation resumes from the trigger item after a submenu was closed', async ({ page }) => {
    await openSubmenuFromKeyboard(page);
    await page.keyboard.press('ArrowLeft');

    await page.keyboard.press('ArrowDown');

    /** 'Delete' is the item right after 'Has children', not the first item of the list */
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeFocused();
  });

  test('Escape after a hover-opened submenu returns focus to the hovered item', async ({ page }) => {
    await page.getByRole('menuitem', { name: 'Has children' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Child A' })).toBeVisible();

    await page.keyboard.press('Escape');

    /**
     * Hovering opens a nested popover without going through showNestedItems(), so the item it
     * was opened from used to go unrecorded and there was nothing to hand the focus back to
     */
    await expect(page.getByRole('menuitem', { name: 'Child A' })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Has children' })).toBeFocused();
  });

  test('a submenu closed by hovering another item leaves the menu reachable by Tab', async ({ page }) => {
    await page.getByRole('menuitem', { name: 'Has children' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Child A' })).toBeVisible();

    await page.getByRole('menuitem', { name: 'Simple Item' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Child A' })).toHaveCount(0);

    const tabbable = await page.locator('.ce-popover-item').evaluateAll(items =>
      items.filter(item => item.getAttribute('tabindex') === '0').length);

    expect(tabbable).toBe(1);
  });
});

test.describe('Tab leafs the items', () => {
  test('Tab cycles the items of a popover without a search field', async ({ page }) => {
    /**
     * Editor.js relies on Tab leafing the items rather than leaving the popover, which is a
     * deliberate departure from the WAI-ARIA menu pattern. The items share one roving tabindex,
     * so the browser sees a single stop here and the ring has to be walked by the popover
     */
    await showPopover(page, 'nestedInput');

    const first = page.getByRole('menuitem', { name: 'Simple item' });
    const last = page.getByRole('menuitem', { name: 'Has children' });

    await page.keyboard.press('ArrowDown');
    await expect(first).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(last).toBeFocused();

    /** Round the end of the list rather than out of the popover */
    await page.keyboard.press('Tab');
    await expect(first).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(last).toBeFocused();
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

  test('a closed inline popover is hidden from assistive tech too', async ({ page }) => {
    await openFixture(page, 'inline');

    const popover = page.locator('.ce-popover');
    const bold = page.getByRole('button', { name: 'Bold',
      exact: true });

    await expect(popover).toHaveJSProperty('inert', true);
    await expect(bold).toHaveCount(0);

    await page.getByRole('button', { name: /^Open/ }).click();

    await expect(popover).toHaveJSProperty('inert', false);
    await expect(bold).toBeVisible();

    await hidePopover(page);

    await expect(popover).toHaveJSProperty('inert', true);
    await expect(bold).toHaveCount(0);
  });

  test('a closed inline popover is out of the real accessibility tree too', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'reading the real accessibility tree needs a CDP session, which only Chromium exposes');

    await showPopover(page, 'inline');

    expect(await accessibleTreeNames(page, context)).toContain('Bold');

    await hidePopover(page);

    expect(await accessibleTreeNames(page, context)).not.toContain('Bold');
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

  test('the highlight follows the button Tab moved the focus to', async ({ page }) => {
    await showPopover(page, 'inline');

    const bold = page.getByRole('button', { name: 'Bold',
      exact: true });

    await page.getByRole('button', { name: 'Open inline toolbar' }).focus();
    await page.keyboard.press('Tab');

    /**
     * Every item is an individual Tab stop here, so Tab can move the real focus behind the
     * Flipper's back. Enter is handled by the Flipper and acts on its cursor, so the cursor
     * has to follow the focus - otherwise the two point at different items
     */
    await expect(bold).toHaveClass(/ce-popover-item--focused/);

    const highlighted = await page.locator('.ce-popover-item--focused').count();

    expect(highlighted).toBe(1);
  });

  test('Enter activates the button the focus is on, not the one arrows highlighted earlier', async ({ page }) => {
    await showPopover(page, 'inline');

    /** Highlight the second item with the arrows, without moving the real focus */
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    await expect(page.getByRole('button', { name: 'Italic',
      exact: true })).toHaveClass(/ce-popover-item--focused/);

    /** Now Tab the real focus onto the first item and activate it */
    await page.getByRole('button', { name: 'Open inline toolbar' }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    expect(await activatedItems(page)).toEqual(['bold']);
  });
});

test.describe('inline toolbar horizontal navigation', () => {
  test('ArrowRight and ArrowLeft move the highlight along the bar once it is entered', async ({ page }) => {
    await openFixture(page, 'inlineSelection');
    await selectWordAndShowPopover(page);

    const editable = page.locator('#editable');
    const bold = page.getByRole('button', { name: 'Bold',
      exact: true });
    const italic = page.getByRole('button', { name: 'Italic',
      exact: true });

    await page.keyboard.press('ArrowDown');
    await expect(bold).toHaveClass(/ce-popover-item--focused/);

    await page.keyboard.press('ArrowRight');
    await expect(italic).toHaveClass(/ce-popover-item--focused/);
    await expect(editable).toHaveAttribute('aria-activedescendant', await italic.getAttribute('id') as string);

    await page.keyboard.press('ArrowLeft');
    await expect(bold).toHaveClass(/ce-popover-item--focused/);

    /** The selection the toolbar acts on stays intact, the arrows were taken by the bar */
    expect(await selectionState(page)).toEqual({ rangeCount: 1,
      text: 'bold' });
  });

  test('horizontal arrows are left to the text caret until the bar is entered', async ({ page }) => {
    await openFixture(page, 'inlineSelection');
    await selectWordAndShowPopover(page);

    await page.keyboard.press('ArrowRight');

    /** Native ArrowRight collapses the selection, nothing in the bar got highlighted */
    expect((await selectionState(page)).text).toBe('');
    await expect(page.locator('.ce-popover-item--focused')).toHaveCount(0);
  });

  test('horizontal arrows move the real focus along once Tab has put it on a button', async ({ page }) => {
    await showPopover(page, 'inline');

    await page.getByRole('button', { name: 'Open inline toolbar' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Bold',
      exact: true })).toBeFocused();

    await page.keyboard.press('ArrowRight');

    await expect(page.getByRole('button', { name: 'Italic',
      exact: true })).toBeFocused();
  });
});

test.describe('html items in the keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await showPopover(page, 'htmlItems');
  });

  test('ArrowRight opens the submenu of an html item', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('button', { name: 'More' })).toBeFocused();

    await page.keyboard.press('ArrowRight');

    await expect(page.getByRole('menuitem', { name: 'Child A' })).toBeFocused();
  });

  test('highlighting an html item\'s control reports it as the active descendant', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    const control = page.getByRole('button', { name: 'More' });

    await expect(control).toBeFocused();

    const id = await control.getAttribute('id');
    const emitted = await activeDescendants(page);

    expect(id).toBeTruthy();
    expect(emitted[emitted.length - 1]).toBe(id);
  });

  test('checkboxes, selects and links inside an html item are navigable', async ({ page }) => {
    /** The controls item comes last, and ArrowUp enters the list from its end */
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('link', { name: 'Link' })).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('combobox', { name: 'Pick' })).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('checkbox', { name: 'Check' })).toBeFocused();
  });
});

test.describe('focus of the opened popover', () => {
  test('a submenu built with isFlippable: false takes the focus when opened from the keyboard', async ({ page }) => {
    await showPopover(page, 'nestedNonFlippable');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('menuitem', { name: 'Child A' })).toBeFocused();
  });

  test('show() on an opened popover keeps the original opener to return the focus to', async ({ page }) => {
    await showPopoverWithKeyboard(page, 'menu');

    /** The search field has the focus now, it must not become the element to return it to */
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeFocused();

    await callShow(page);
    await page.keyboard.press('Escape');

    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  });

  test('closing the root while a submenu has the focus returns it to the opener', async ({ page }) => {
    /**
     * The submenu's onOpen focuses an input inside it, and the root is then closed directly -
     * the way a link tool closes the toolbar once its URL is submitted
     */
    await showPopoverWithKeyboard(page, 'nestedInput');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('textbox', { name: 'Nested input' })).toBeFocused();

    await hidePopover(page);

    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  });

  test('items of a flippable: false popover keep the default focus ring', async ({ page }) => {
    /** There is no Flipper to apply the --focused highlight, the ring is the only indicator */
    await showPopover(page, 'plainMenu');

    await page.getByRole('button', { name: 'Open menu' }).focus();
    await page.keyboard.press('Tab');

    const copy = page.getByRole('menuitem', { name: 'Copy' });

    await expect(copy).toBeFocused();
    expect(await copy.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  });
});

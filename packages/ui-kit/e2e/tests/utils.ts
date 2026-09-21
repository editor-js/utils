import type { BrowserContext, Page } from '@playwright/test';

/**
 * Fixture pages served by the vite dev server
 */
export const fixtures = {
  menu: '/e2e/fixtures/menu.html',
  inline: '/e2e/fixtures/inline.html',
  mobile: '/e2e/fixtures/mobile.html',
  mobileHtmlItem: '/e2e/fixtures/mobile-html-item.html',
  inlineSelection: '/e2e/fixtures/inline-selection.html',
  plainMenu: '/e2e/fixtures/plain-menu.html',
  nestedInput: '/e2e/fixtures/nested-input.html',
  htmlItems: '/e2e/fixtures/html-items.html',
  nestedNonFlippable: '/e2e/fixtures/nested-non-flippable.html',
  confirmationToggle: '/e2e/fixtures/confirmation-toggle.html',
  mobilePlain: '/e2e/fixtures/mobile-plain.html',
  mobileEmpty: '/e2e/fixtures/mobile-empty.html',
} as const;

/**
 * Opens the requested fixture and waits for the popover to be constructed
 * @param page - playwright page object
 * @param fixture - fixture page to open
 */
export async function openFixture(page: Page, fixture: keyof typeof fixtures): Promise<void> {
  await page.goto(fixtures[fixture]);
  await page.waitForSelector('body[data-ready="true"]');
}

/**
 * Opens the fixture and shows the popover it contains
 * @param page - playwright page object
 * @param fixture - fixture page to open
 */
export async function showPopover(page: Page, fixture: keyof typeof fixtures): Promise<void> {
  await openFixture(page, fixture);
  await page.getByRole('button', { name: /^Open/ }).click();
}

/**
 * Opens the fixture and shows the popover it contains from the keyboard.
 *
 * Needed wherever the test relies on the focus returning to the trigger: Safari does not focus
 * a button on click, and a popover opened by a click there has no opener to return the focus to
 * @param page - playwright page object
 * @param fixture - fixture page to open
 */
export async function showPopoverWithKeyboard(page: Page, fixture: keyof typeof fixtures): Promise<void> {
  await openFixture(page, fixture);
  await page.getByRole('button', { name: /^Open/ }).focus();
  await page.keyboard.press('Enter');
}

/**
 * Test hooks the fixture pages expose on the window object
 */
interface FixtureWindow {
  /**
   * Names of the items activated since the page was loaded
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- matches the global set by the fixtures
  __activated: string[];
}

/**
 * Popover instance the fixture pages expose for direct manipulation
 */
interface PopoverWindow {
  /**
   * Popover under test
   */
  popover: {
    /**
     * Opens the popover
     */
    show: () => void;

    /**
     * Closes the popover
     */
    hide: () => void;

    /**
     * Tears the popover down
     */
    destroy: () => void;

    /**
     * Whether the popover is currently open
     */
    isShown: boolean;

    /**
     * Appends an item to the popover
     */
    addItem: (params: Record<string, unknown>) => void;

    /**
     * Removes an item from the popover by its name
     */
    removeItemByName: (name: string) => void;
  };
}

/**
 * Closes the popover of the fixture page
 * @param page - playwright page object
 */
export async function hidePopover(page: Page): Promise<void> {
  await page.evaluate(() => (window as unknown as PopoverWindow).popover.hide());
}

/**
 * Calls show() on the fixture page's popover directly, e.g. on one that is already open
 * @param page - playwright page object
 */
export async function callShow(page: Page): Promise<void> {
  await page.evaluate(() => (window as unknown as PopoverWindow).popover.show());
}

/**
 * Destroys the fixture page's popover
 * @param page - playwright page object
 */
export async function destroyPopover(page: Page): Promise<void> {
  await page.evaluate(() => (window as unknown as PopoverWindow).popover.destroy());
}

/**
 * Appends an item to the fixture page's popover
 * @param page - playwright page object
 * @param params - parameters of the item to add
 */
export async function addItem(page: Page, params: Record<string, unknown>): Promise<void> {
  await page.evaluate(
    itemParams => (window as unknown as PopoverWindow).popover.addItem(itemParams),
    params
  );
}

/**
 * Removes an item from the fixture page's popover
 * @param page - playwright page object
 * @param name - the item's 'name' as it was given in its construction params
 */
export async function removeItemByName(page: Page, name: string): Promise<void> {
  await page.evaluate(
    itemName => (window as unknown as PopoverWindow).popover.removeItemByName(itemName),
    name
  );
}

/**
 * Returns whether the fixture page's popover is currently open
 * @param page - playwright page object
 */
export async function isPopoverShown(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as PopoverWindow).popover.isShown);
}

/**
 * Returns names of the items activated on the page so far
 * @param page - playwright page object
 */
export async function activatedItems(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as FixtureWindow).__activated);
}

/**
 * Subset of the accessibility tree returned by the Accessibility.getFullAXTree CDP command
 */
interface AXTree {
  /**
   * Every node of the tree, flattened
   */
  nodes: Array<{
    /**
     * Accessible name of the node, absent for the nodes that have none
     */
    name?: {
      /**
       * Computed name value
       */
      value?: string;
    };
  }>;
}

/**
 * Returns every accessible name currently present in the page's real accessibility tree, via
 * the same Chrome DevTools Protocol tree a screen reader like VoiceOver actually consumes.
 * getByRole() is not enough for this: it computes roles from the DOM/CSS itself and does not
 * honour `inert`, so it still finds elements a real screen reader would never reach
 * @param page - playwright page object
 * @param context - browser context the page belongs to, needed to open a CDP session
 */
export async function accessibleTreeNames(page: Page, context: BrowserContext): Promise<string[]> {
  const client = await context.newCDPSession(page);

  try {
    const { nodes } = await client.send('Accessibility.getFullAXTree') as AXTree;

    return nodes
      .map(node => node.name?.value)
      .filter((name): name is string => Boolean(name));
  } finally {
    await client.detach();
  }
}

/**
 * Hook the html-items fixture exposes on the window object
 */
interface ActiveDescendantsWindow {
  /**
   * Every id PopoverEvent.ActiveDescendantChanged was emitted with, in order
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- matches the global set by the fixture
  __activeDescendants: Array<string | null>;
}

/**
 * Returns the ids PopoverEvent.ActiveDescendantChanged was emitted with so far, in order.
 * Only the fixtures subscribing to the event record them, see html-items.html
 * @param page - playwright page object
 */
export async function activeDescendants(page: Page): Promise<Array<string | null>> {
  return page.evaluate(() => (window as unknown as ActiveDescendantsWindow).__activeDescendants);
}

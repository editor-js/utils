import type { Page } from '@playwright/test';

/**
 * Fixture pages served by the vite dev server
 */
export const fixtures = {
  menu: '/e2e/fixtures/menu.html',
  inline: '/e2e/fixtures/inline.html',
  mobile: '/e2e/fixtures/mobile.html',
  inlineSelection: '/e2e/fixtures/inline-selection.html',
  plainMenu: '/e2e/fixtures/plain-menu.html',
  nestedInput: '/e2e/fixtures/nested-input.html',
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
     * Closes the popover
     */
    hide: () => void;

    /**
     * Whether the popover is currently open
     */
    isShown: boolean;
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

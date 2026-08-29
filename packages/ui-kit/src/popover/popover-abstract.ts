import type { PopoverItem } from './components/popover-item';
import { PopoverItemDefault, PopoverItemSeparator, css as popoverItemCls } from './components/popover-item';
import type { Flipper } from '@editorjs/dom';
import { make } from '@editorjs/dom';
import type { SearchInput } from './components/search-input';
import { EventsDispatcher } from '@editorjs/helpers';
import { Listeners, delay } from '@editorjs/helpers';
import type {
  PopoverItemParams,
  PopoverItemRenderParamsMap,
  PopoverEventMap,
  PopoverMessages,
  PopoverParams,
  PopoverNodes
} from './types';
import {
  PopoverItemType
} from './types';
import { PopoverEvent } from './types';
import { css } from './popover.const';
import { PopoverItemHtml } from './components/popover-item/popover-item-html/popover-item-html';

/**
 * Delay before filling the live region in, so that its content is treated as a change
 * and hence announced even when the same message repeats
 */
const ANNOUNCEMENT_DELAY = 50;

/**
 * Class responsible for rendering popover and handling its behaviour
 */
export abstract class PopoverAbstract<Nodes extends PopoverNodes = PopoverNodes> extends EventsDispatcher<PopoverEventMap> {
  /**
   * Flipper - module for keyboard iteration between the items.
   * Constructed by the subclasses, since what it is allowed to handle differs per platform
   */
  public flipper?: Flipper;

  /**
   * List of popover items
   */
  protected items: Array<PopoverItem>;

  /**
   * Listeners util instance
   */
  protected listeners: Listeners = new Listeners();

  /**
   * Refs to created HTML elements
   */
  protected nodes: Nodes;

  /**
   * List of default popover items that are searchable and may have confirmation state
   */
  protected get itemsDefault(): PopoverItemDefault[] {
    return this.items.filter(item => item instanceof PopoverItemDefault);
  }

  /**
   * Instance of the Search Input
   */
  protected search: SearchInput | undefined;

  /**
   * True if keyboard navigation should move real DOM focus between the items.
   * Popovers that act on the text selection have to keep the focus where it is
   */
  protected get movesFocusToItems(): boolean {
    return true;
  }

  /**
   * True while the whole item list is a single Tab stop and the Flipper moves that stop
   * around as the user navigates with the arrow keys
   */
  protected get hasRovingTabindex(): boolean {
    return this.flipper !== undefined && this.movesFocusToItems;
  }

  /**
   * ARIA role for the items container. Menus by default; inline popovers are toolbars
   */
  protected get itemsContainerRole(): string {
    return 'menu';
  }

  /**
   * Messages that will be displayed in popover
   */
  protected messages: PopoverMessages = {
    nothingFound: 'Nothing found',
    search: 'Search',
    back: 'Back',
    result: '{count} result',
    results: '{count} results',
  };

  /**
   * Constructs the instance
   * @param params - popover construction params
   * @param itemsRenderParams - popover item render params.
   * The parameters that are not set by user via popover api but rather depend on technical implementation
   */
  constructor(
    protected readonly params: PopoverParams,
    protected readonly itemsRenderParams: PopoverItemRenderParamsMap = {}
  ) {
    super();

    this.items = this.buildItems(params.items);

    if (params.messages) {
      this.messages = {
        ...this.messages,
        ...params.messages,
      };
    }

    /** Build html elements */
    this.nodes = {} as Nodes;

    this.nodes.popoverContainer = make('div', [css.popoverContainer]);

    this.nodes.nothingFoundMessage = make('div', [css.nothingFoundMessage], {
      textContent: this.messages.nothingFound,
    });

    this.nodes.popoverContainer.appendChild(this.nodes.nothingFoundMessage);

    this.nodes.liveRegion = make('div', [css.liveRegion]);
    this.nodes.liveRegion.setAttribute('role', 'status');
    this.nodes.liveRegion.setAttribute('aria-live', 'polite');

    this.nodes.popoverContainer.appendChild(this.nodes.liveRegion);
    this.nodes.items = make('div', [css.items]);
    this.nodes.items.setAttribute('role', this.itemsContainerRole);

    /**
     * The items container scrolls when its content overflows, and browsers make scrollable
     * regions sequentially focusable by default so they can be scrolled by keyboard.
     * That would put the container itself in the Tab order (and, while closed, block Tab
     * from reaching anything past it), so it explicitly opts out here.
     */
    this.nodes.items.tabIndex = -1;

    if (this.messages.label !== undefined) {
      this.nodes.items.setAttribute('aria-label', this.messages.label);
    }

    this.renderItems(this.items);

    this.nodes.popoverContainer.appendChild(this.nodes.items);

    this.listeners.on(this.nodes.popoverContainer, 'click', (event: Event) => this.handleClick(event));

    /**
     * Real focus can land on an item without the Flipper knowing about it: it may be moved
     * there programmatically, or, in a popover that doesn't move focus itself, by Tab walking
     * between the individually tabbable items behind the Flipper's back. Enter, however, is
     * handled by the Flipper and acts on its cursor, so the two would activate different items
     * unless the cursor follows the focus.
     *
     * Keeping them in sync also guarantees a focused item always carries the --focused class,
     * which is what conveys the focus visually (the default ring is suppressed, see popover.css)
     */
    this.listeners.on(this.nodes.items, 'focusin', (event: Event) => this.syncFlipperCursor(event as FocusEvent));

    /**
     * Items are plain elements (not buttons), so Enter/Space need to be turned into a click
     * explicitly. Flipper already does this for its focused item on Enter and stops the event
     * from getting here, so this only fires when Flipper is inactive or doesn't own the key
     * (no keyboard navigation configured, or a platform, like mobile, that has no Flipper at all).
     */
    this.listeners.on(this.nodes.popoverContainer, 'keydown', (event: Event) => this.handleItemKeyDown(event as KeyboardEvent));

    this.nodes.popover = make('div', [
      css.popover,
      this.params.class,
    ]);

    this.nodes.popover.appendChild(this.nodes.popoverContainer);

    /**
     * The closed state is opacity/max-height driven so the open transition can animate,
     * which leaves the popover in the accessibility tree even though nothing is visible
     * on screen. inert keeps it out of both the AT tree and the tab order while closed
     */
    this.nodes.popover.inert = true;
  }

  /**
   * Returns the radio-group key of the item, or null if the item does not belong to a group
   * @param item - popover item to read the toggle param of. Undefined when looking past the last item
   */
  private static getToggleGroupKey(item: PopoverItem | undefined): string | null {
    if (!(item instanceof PopoverItemDefault) || typeof item.toggle !== 'string') {
      return null;
    }

    return item.toggle;
  }

  /**
   * Returns HTML element corresponding to the popover
   */
  public getElement(): HTMLElement {
    return this.nodes.popover;
  }

  /**
   * Whether the popover is currently open
   */
  public get isShown(): boolean {
    return this.nodes.popover.classList.contains(css.popoverOpened);
  }

  /**
   * Adds a single item to the popover
   * @param params - item parameters
   */
  public addItem(params: PopoverItemParams): void {
    const [item] = this.buildItems([params]);

    this.items.push(item);

    this.refreshItems();
  }

  /**
   * Removes an item from the popover by its name
   * @param name - name of the item to be removed
   */
  public removeItemByName(name: string): void {
    const foundItemIndex = this.items.findIndex(item => item.name === name);

    if (foundItemIndex === -1) {
      return;
    }

    const [removedItem] = this.items.splice(foundItemIndex, 1);

    removedItem.destroy();
    removedItem.getElement().remove();

    this.refreshItems();
  }

  /**
   * Open popover
   */
  public show(): void {
    this.nodes.popover.classList.add(css.popoverOpened);
    this.nodes.popover.inert = false;

    if (this.search !== undefined) {
      this.search.toggleTabbable(true);
      this.search.focus();
    }

    if (this.params.closeOnOutsideClick !== false) {
      /**
       * Need capture phase here to avoid triggering on the same event show() was called
       */
      this.listeners.on(
        document,
        'click',
        this.outsideClickHandler,
        {
          capture: true,
          passive: true,
        }
      );
    }
  }

  /**
   * Closes popover
   */
  public hide(): void {
    this.nodes.popover.classList.remove(css.popoverOpened);
    this.nodes.popover.classList.remove(css.popoverOpenTop);
    this.nodes.popover.inert = true;

    this.itemsDefault.forEach(item => item.reset());

    if (this.search !== undefined) {
      this.search.clear();
      this.search.toggleTabbable(false);
    }

    this.listeners.off(document, 'click', this.outsideClickHandler);

    this.emit(PopoverEvent.Closed);
  }

  /**
   * Clears memory
   */
  public destroy(): void {
    this.items.forEach(item => item.destroy());
    this.nodes.popover.remove();
    this.listeners.removeAll();
    this.search?.destroy();
  }

  /**
   * Looks for the item by name and imitates click on it
   * @param name - item to look for and activate
   */
  public activateItemByName(name: string): void {
    const foundItem = this.items.find(item => item.name === name);

    this.handleItemClick(foundItem);
  }

  /**
   * Factory method for creating popover items
   * @param items - list of items params
   */
  protected buildItems(items: PopoverItemParams[]): Array<PopoverItem> {
    return items.map((item) => {
      switch (item.type) {
        case PopoverItemType.Separator:
          return new PopoverItemSeparator();
        case PopoverItemType.Html:
          return new PopoverItemHtml(item, this.itemsRenderParams[PopoverItemType.Html]);
        default:
          return new PopoverItemDefault(item, this.itemsRenderParams[PopoverItemType.Default]);
      }
    });
  }

  /**
   * Appends items to the items container.
   *
   * Items sharing the same string 'toggle' key behave like a radio group, so neighbouring
   * items with the same key get wrapped into a role="group" element to convey the grouping.
   * The wrapper is not rendered as a box (display: contents), hence it does not affect layout.
   * @param items - list of already constructed popover items to append
   */
  protected renderItems(items: Array<PopoverItem>): void {
    /** Toggle key of the group being filled, null when items are appended to the container itself */
    let currentGroupKey: string | null = null;
    let currentGroupEl: HTMLElement | null = null;

    items.forEach((item, index) => {
      const itemEl = item.getElement();

      if (itemEl === null) {
        return;
      }

      const groupKey = PopoverAbstract.getToggleGroupKey(item);

      if (groupKey === null || groupKey !== currentGroupKey) {
        currentGroupKey = groupKey;
        currentGroupEl = null;
      }

      const isGroupStart = groupKey !== null && currentGroupEl === null;
      const hasGroupSibling = isGroupStart && PopoverAbstract.getToggleGroupKey(items[index + 1]) === groupKey;

      if (hasGroupSibling) {
        currentGroupEl = make('div', [css.itemsGroup]);
        currentGroupEl.setAttribute('role', 'group');

        this.nodes.items.appendChild(currentGroupEl);
      }

      (currentGroupEl ?? this.nodes.items).appendChild(itemEl);
    });
  }

  /**
   * True while the Flipper cursor should follow the real DOM focus. Desktop suspends it
   * while a nested popover is open, since the keyboard belongs to that one
   */
  protected get isFlipperCursorSyncEnabled(): boolean {
    return true;
  }

  /**
   * Called whenever the keyboard navigation cursor moves, the Flipper's own flips included.
   * Does nothing by default
   */
  protected onFlip = (): void => {};

  /**
   * Moves the keyboard navigation cursor to the specified element, so that the highlight, the
   * roving tabindex and — in the popovers that move it — the real focus all point at the same
   * item. Going through the Flipper rather than focusing the element directly is what keeps
   * its cursor in sync: otherwise the next arrow press would resume from the top of the list
   * @param element - one of the items the popover navigates between
   * @returns false when the element is not one the Flipper navigates, so that the caller can
   * decide what to do about the focus itself
   */
  protected moveCursorTo(element: HTMLElement): boolean {
    if (this.flipper === undefined) {
      return false;
    }

    /**
     * Indexed against the Flipper's own list rather than against flippableElements, and
     * activated without passing a list at all: while a search query is applied the Flipper
     * navigates only the matching items, and handing it the full list here would silently
     * put the filtered-out ones back into the navigation
     */
    const index = this.flipper.currentItems.indexOf(element);

    if (index === -1) {
      return false;
    }

    this.flipper.activate(undefined, index);
    this.onFlip();

    return true;
  }

  /**
   * Lays the item list out again and brings the keyboard navigation in sync with it.
   *
   * Items cannot simply be appended to or removed from the container: radio-group wrapping
   * depends on an item's neighbours, so a single change may add or drop a role="group" wrapper
   * anywhere in the list. The Flipper has to learn about the new set as well, otherwise an item
   * added to an already opened popover stays unreachable until it is closed and opened again
   */
  protected refreshItems(): void {
    /**
     * Noted before the container is taken apart: detaching the focused element moves the focus
     * to the body, and re-appending it does not bring the focus back on its own
     */
    const active = document.activeElement;
    const previouslyFocused = active instanceof HTMLElement && this.nodes.items.contains(active) ? active : null;

    this.nodes.items.replaceChildren();

    this.renderItems(this.items);

    if (!this.isShown) {
      return;
    }

    /**
     * Items filtered out by a search query are off screen, so they have no business in the
     * keyboard navigation - handing the Flipper the full list would silently put them back
     */
    const navigable = this.flippableElements.filter(element => element.offsetParent !== null);

    /**
     * Only handed the new list while the Flipper actually owns the keyboard: a deactivated one
     * has passed it to a nested popover, and waking it up here would leave both of them
     * reacting to the arrow keys. It picks the list up when it is activated again
     */
    if (this.flipper?.isActivated === true) {
      /**
       * Deactivated first, so that the cursor is dropped while it still points into the old
       * list. The new one can be shorter than the position it was left at, and DomIterator
       * bounds-checks neither dropCursor() nor its leafing - both index the array directly
       */
      this.flipper.deactivate();
      this.flipper.activate(navigable);
    }

    this.toggleItemsTabbable(true, navigable);

    /** Hand the focus, and with it the Flipper cursor, back to the item the user was on */
    if (previouslyFocused?.isConnected === true && !this.moveCursorTo(previouslyFocused)) {
      previouslyFocused.focus();
    }
  }

  /**
   * Returns list of elements available for keyboard navigation.
   *
   * An html item is a layout-only wrapper (role="none") around real controls, so it is those
   * controls that take part in the navigation rather than the wrapper itself. Separators are
   * left out: they are not interactive and there is nothing to navigate to on them
   */
  protected get flippableElements(): HTMLElement[] {
    return this.items
      .map((item) => {
        if (item instanceof PopoverItemDefault) {
          return item.getElement();
        }

        if (item instanceof PopoverItemHtml) {
          return item.getControls();
        }
      })
      .flat()
      .filter(element => element !== undefined && element !== null);
  }

  /**
   * Makes the items of the opened popover reachable by Tab, so that the popover
   * can be entered from the keyboard.
   *
   * When the Flipper actually moves real DOM focus between items (arrow-key roving tabindex),
   * only the first item is made tabbable here and Flipper takes over moving the `0` as
   * navigation happens. Otherwise – no Flipper at all (`flippable: false`), or one that only
   * moves a visual highlight without touching focus (inline popovers, see `movesFocusToItems`) –
   * there is no mechanism left to reach items past the first one, so every item is made an
   * individual Tab stop instead.
   *
   * A closed popover stays in the DOM, so all its items become untabbable on hide,
   * otherwise Tab pressed outside of the popover would land on a hidden item
   * @param isTabbable - true if the popover is opened and should be reachable by Tab
   * @param elements - elements to make tabbable, defaults to all of them. Passed explicitly
   * while searching, so that only the currently visible items are considered
   */
  protected toggleItemsTabbable(isTabbable: boolean, elements: HTMLElement[] = this.flippableElements): void {
    this.flippableElements.forEach((element) => {
      element.tabIndex = -1;
    });

    if (!isTabbable || elements.length === 0) {
      return;
    }

    if (this.hasRovingTabindex) {
      elements[0].tabIndex = 0;
    } else {
      elements.forEach((element) => {
        element.tabIndex = 0;
      });
    }
  }

  /**
   * Announces the message to screen readers via the popover live region.
   * The region is cleared first, otherwise repeating the same text is not announced
   * @param message - text to announce
   */
  protected announce(message: string): void {
    const region = this.nodes.liveRegion;

    region.textContent = '';

    delay(() => {
      region.textContent = message;
    }, ANNOUNCEMENT_DELAY)();
  }

  /**
   * Retrieves popover item that is the target of the specified event
   * @param event - event to retrieve popover item from
   */
  protected getTargetItem(event: Event): PopoverItemDefault | PopoverItemHtml | undefined {
    return this.items
      .filter(item => item instanceof PopoverItemDefault || item instanceof PopoverItemHtml)
      .find((item) => {
        const itemEl = item.getElement();

        if (itemEl === null) {
          return false;
        }

        return event.composedPath().includes(itemEl);
      });
  }

  /**
   * Handles popover item click
   * @param item - item object to handle click of
   */
  protected handleItemClick(item: PopoverItem): void {
    if ('isDisabled' in item && (item as PopoverItemDefault).isDisabled == true) {
      return;
    }

    if (item.hasChildren) {
      this.showNestedItems(item as PopoverItemDefault | PopoverItemHtml);

      if ('handleClick' in item && typeof item.handleClick === 'function') {
        item.handleClick();
      }

      return;
    }

    /** Cleanup other items state */
    this.itemsDefault.filter(x => x !== item).forEach(x => x.reset());

    if ('handleClick' in item && typeof item.handleClick === 'function') {
      item.handleClick();
    }

    this.announceConfirmationStateIfNeeded(item);
    this.toggleItemActivenessIfNeeded(item);

    if (item.closeOnActivate === true) {
      this.hide();

      this.emit(PopoverEvent.ClosedOnActivate);
    }
  }

  /**
   * Handler to close popover when click happens outside of it.
   * @param event - click mouse event
   */
  private outsideClickHandler = (event: MouseEvent): void => {
    const path = event.composedPath();

    if (path.includes(this.nodes.popover)) {
      return;
    }

    this.hide();
  };

  /**
   * Handles clicks inside popover
   * @param event - item to handle click of
   */
  private handleClick(event: Event): void {
    const item = this.getTargetItem(event);

    if (item === undefined) {
      return;
    }

    this.handleItemClick(item);
  }

  /**
   * Moves the Flipper cursor to the item that has just received the real DOM focus,
   * so that Enter (handled by the Flipper) always acts on the item the user is actually on
   * @param event - focusin event fired inside the items container
   */
  private syncFlipperCursor(event: FocusEvent): void {
    if (!this.isFlipperCursorSyncEnabled) {
      return;
    }

    const target = event.target as HTMLElement;

    /** Cursor is already there: this is the focus the Flipper has just moved itself */
    if (target.classList.contains(popoverItemCls.focused)) {
      return;
    }

    this.moveCursorTo(target);
  }

  /**
   * Activates an item via Enter/Space when its root element itself is the keydown target.
   * Descendant controls (search input, custom HTML content) are left untouched, since they
   * either handle these keys natively (buttons, links) or need them for their own purpose
   * (text inputs).
   * @param event - keydown event to handle
   */
  private handleItemKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const item = this.getTargetItem(event);
    const itemEl = item?.getElement();

    if (itemEl === undefined || itemEl === null || event.target !== itemEl) {
      return;
    }

    event.preventDefault();
    itemEl.click();
  }

  /**
   * Announces the confirmation request, since the item silently becomes a different control:
   * same element, new icon, new title and new action
   * @param clickedItem - popover item that was clicked
   */
  private announceConfirmationStateIfNeeded(clickedItem: PopoverItem): void {
    if (!(clickedItem instanceof PopoverItemDefault) || !clickedItem.isConfirmationStateEnabled) {
      return;
    }

    const name = clickedItem.accessibleName;

    if (name !== undefined) {
      this.announce(name);
    }
  }

  /**
   * - Toggles item active state, if clicked popover item has property 'toggle' set to true.
   *
   * - Performs radiobutton-like behavior if the item has property 'toggle' set to string key.
   * (All the other items with the same key get inactive, and the item gets active)
   * @param clickedItem - popover item that was clicked
   */
  private toggleItemActivenessIfNeeded(clickedItem: PopoverItem): void {
    if (!(clickedItem instanceof PopoverItemDefault)) {
      return;
    }

    if (clickedItem.toggle === true) {
      clickedItem.toggleActive();
    }

    if (typeof clickedItem.toggle === 'string') {
      const itemsInToggleGroup = this.itemsDefault.filter(item => item.toggle === clickedItem.toggle);

      /** If there's only one item in toggle group, toggle it */
      if (itemsInToggleGroup.length === 1) {
        clickedItem.toggleActive();

        return;
      }

      /** Set clicked item as active and the rest items with same toggle key value as inactive */
      itemsInToggleGroup.forEach((item) => {
        item.toggleActive(item === clickedItem);
      });
    }
  }

  /**
   * Handles displaying nested items for the item. Behaviour differs depending on platform.
   * @param item – item object to show nested popover for
   */
  protected abstract showNestedItems(item: PopoverItemDefault | PopoverItemHtml): void;
}

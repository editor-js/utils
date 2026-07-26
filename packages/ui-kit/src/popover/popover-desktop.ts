import { Flipper } from '@editorjs/dom';
import { PopoverAbstract } from './popover-abstract';
import type { PopoverItemParams, PopoverItemRenderParamsMap } from './types';
import type { PopoverItem } from './components/popover-item';
import { PopoverItemSeparator, css as popoverItemCls } from './components/popover-item';
import type { PopoverParams } from './types';
import { PopoverEvent } from './types';
import { CSSVariables, css } from './popover.const';
import type { SearchableItem } from './components/search-input';
import { SearchInput, SearchInputEvent } from './components/search-input';
import { cacheable, delay, keyCodes } from '@editorjs/helpers';
import { PopoverItemDefault } from './components/popover-item';
import { PopoverItemHtml } from './components/popover-item/popover-item-html/popover-item-html';
import { focus } from '@editorjs/caret';

/**
 * Delay before care focus after flipping to the next item to allow DOM update
 */
const FOCUS_DELAY = 50;

/**
 * Delay before announcing search results, so a burst of keystrokes collapses into one
 * announcement instead of restarting the screen reader on every character typed
 */
const SEARCH_RESULTS_ANNOUNCEMENT_DEBOUNCE = 500;

/**
 * Desktop popover.
 * On desktop devices popover behaves like a floating element. Nested popover appears at right or left side.
 * @todo support rtl for nested popovers and search
 */
export class PopoverDesktop extends PopoverAbstract {
  /**
   * Flipper - module for keyboard iteration between elements
   */
  public flipper?: Flipper;

  /**
   * Popover nesting level. 0 value means that it is a root popover
   */
  public nestingLevel = 0;

  /**
   * Reference to nested popover if exists.
   * Undefined by default, PopoverDesktop when exists and null after destroyed.
   */
  protected nestedPopover: PopoverDesktop | undefined | null;

  /**
   * Item nested popover is displayed for
   */
  protected nestedPopoverTriggerItem: PopoverItem | null = null;

  /**
   * Last hovered item inside popover.
   * Is used to determine if cursor is moving inside one item or already moved away to another one.
   * Helps prevent reopening nested popover while cursor is moving inside one item area.
   */
  private previouslyHoveredItem: PopoverItem | null = null;

  /**
   * Id of the pending debounced search-results announcement, used to collapse a burst of
   * keystrokes into a single announcement
   */
  private searchResultsAnnouncementTimeout: number | undefined;

  /**
   * Element that was focused right before the popover opened. Restored on close, but only
   * when the close didn't already hand focus somewhere else (e.g. a click on another trigger,
   * which focuses that trigger before this popover ever finds out it should close)
   */
  private previouslyFocusedElement: HTMLElement | null = null;

  /**
   * Element of the page that creates 'scope' of the Popover.
   * If possible, Popover will not cross specified element's borders when opening.
   */
  private scopeElement: HTMLElement = document.body;

  /**
   * Construct the instance
   * @param params - Popover configuration params
   * @param itemsRenderParams – Popover item render params.
   * The parameters that are not set by user via Popover api but rather depend on technical implementation
   */
  constructor(params: PopoverParams, itemsRenderParams?: PopoverItemRenderParamsMap) {
    super(params, itemsRenderParams);

    if (params.nestingLevel !== undefined) {
      this.nestingLevel = params.nestingLevel;
    }

    if (this.nestingLevel > 0) {
      this.nodes.popover.classList.add(css.popoverNested);
    }

    if (params.scopeElement !== undefined) {
      this.scopeElement = params.scopeElement;
    }

    if (this.nodes.popoverContainer !== null) {
      this.listeners.on(this.nodes.popoverContainer, 'mouseover', (event: Event) => this.handleHover(event));
    }

    if (params.searchable === true) {
      this.addSearch();
    }

    if (params.flippable !== false) {
      this.flipper = new Flipper({
        items: this.flippableElements,
        focusedItemClass: popoverItemCls.focused,

        /**
         * Keyboard navigation moves real focus between items,
         * otherwise screen readers announce nothing while the highlight travels
         */
        focusItems: this.movesFocusToItems,
        allowedKeys: [
          /**
           * Tab is only Flipper's to handle while it actually moves real focus (roving
           * tabindex). When it doesn't (inline popovers, see movesFocusToItems), claiming Tab
           * here would only shift the highlight and swallow the keypress, leaving native Tab
           * navigation between the individually-tabbable items with nothing to work with
           */
          ...(this.movesFocusToItems ? [keyCodes.TAB] : []),
          keyCodes.UP,
          keyCodes.DOWN,
          keyCodes.ENTER,
        ],
        setCaret: this.setCaretToItem,
      });

      this.flipper.onFlip(this.onFlip);
    }
  }

  /**
   * True if keyboard navigation should move real DOM focus between the items.
   * Popovers that act on the text selection have to keep the focus where it is
   */
  protected get movesFocusToItems(): boolean {
    return true;
  }

  /**
   * Returns true if some item inside popover is focused
   */
  public hasFocus(): boolean {
    if (this.flipper === undefined) {
      return false;
    }

    return this.flipper.hasFocus();
  }

  /**
   * Scroll position inside items container of the popover
   */
  public get scrollTop(): number {
    if (this.nodes.items === null) {
      return 0;
    }

    return this.nodes.items.scrollTop;
  }

  /**
   * Returns visible element offset top
   */
  public get offsetTop(): number {
    if (this.nodes.popoverContainer === null) {
      return 0;
    }

    return this.nodes.popoverContainer.offsetTop;
  }

  /**
   * Open popover
   */
  public show(): void {
    this.previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    this.nodes.popover.style.setProperty(CSSVariables.PopoverHeight, this.size.height + 'px');

    if (!this.shouldOpenBottom) {
      this.nodes.popover.classList.add(css.popoverOpenTop);
    }

    if (!this.shouldOpenRight) {
      this.nodes.popover.classList.add(css.popoverOpenLeft);
    }

    super.show();
    this.flipper?.activate(this.flippableElements);
    this.toggleItemsTabbable(true);

    /**
     * Only the root popover listens: it resolves the deepest currently open nested popover
     * itself at event time, so a single listener is enough to handle the whole chain correctly
     * regardless of how many levels are open
     */
    if (this.nestingLevel === 0) {
      this.listeners.on(document, 'keydown', this.handleNestedNavigationKeyDown, { capture: true });
    }
  }

  /**
   * Closes popover
   */
  public hide = (): void => {
    window.clearTimeout(this.searchResultsAnnouncementTimeout);

    /**
     * Only restore focus if it is still where the popover left it (an item, the search field).
     * A click on another trigger, for example, already moved focus there on mousedown, before
     * this popover even learns it should close, and that focus should not be clobbered
     */
    const shouldRestoreFocus = document.activeElement !== null && this.nodes.popoverContainer.contains(document.activeElement);

    super.hide();

    this.destroyNestedPopoverIfExists();

    this.flipper?.deactivate();
    this.toggleItemsTabbable(false);
    this.emit(PopoverEvent.ActiveDescendantChanged, null);

    this.previouslyHoveredItem = null;

    if (shouldRestoreFocus) {
      this.previouslyFocusedElement?.focus();
    }
    this.previouslyFocusedElement = null;

    if (this.nestingLevel === 0) {
      this.listeners.off(document, 'keydown', this.handleNestedNavigationKeyDown, { capture: true });
    }
  };

  /**
   * Override for addItem method to update search items
   * @param params - parameters of an item to add
   */
  public addItem(params: PopoverItemParams): void {
    super.addItem(params);

    if (this.search !== undefined) {
      this.search.updateItems(this.itemsDefault);
    }
  }

  /**
   * Override for addItem method to update search items
   * @param name - name of the item to be removed
   */
  public removeItemByName(name: string): void {
    super.removeItemByName(name);

    if (this.search !== undefined) {
      this.search.updateItems(this.itemsDefault);
    }
  }

  /**
   * Clears memory
   */
  public destroy(): void {
    this.hide();
    super.destroy();
  }

  /**
   * Handles displaying nested items for the item.
   * @param item – item object to show nested popover for
   */
  protected override showNestedItems(item: PopoverItem): void {
    if (this.nestedPopover !== null && this.nestedPopover !== undefined) {
      return;
    }

    this.nestedPopoverTriggerItem = item;

    this.showNestedPopoverForItem(item);
  }

  /**
   * Handles hover events inside popover items container
   * @param event - hover mouse event data
   */
  protected handleHover(event: Event): void {
    const item = this.getTargetItem(event);

    if (item === undefined) {
      return;
    }

    if (this.previouslyHoveredItem === item) {
      return;
    }

    this.destroyNestedPopoverIfExists();

    this.previouslyHoveredItem = item;

    if (!item.hasChildren) {
      return;
    }

    this.showNestedPopoverForItem(item);
  }

  /**
   * Sets CSS variable with position of item near which nested popover should be displayed.
   * Is used for correct positioning of the nested popover
   * @param nestedPopoverEl - nested popover element
   * @param item – item near which nested popover should be displayed
   */
  protected setTriggerItemPosition(nestedPopoverEl: HTMLElement, item: PopoverItem): void {
    const itemEl = item.getElement();
    const itemOffsetTop = (itemEl ? itemEl.offsetTop : 0) - this.scrollTop;
    const topOffset = this.offsetTop + itemOffsetTop;

    nestedPopoverEl.style.setProperty(CSSVariables.TriggerItemTop, topOffset + 'px');
  }

  /**
   * Destroys existing nested popover
   */
  protected destroyNestedPopoverIfExists(): void {
    if (this.nestedPopover === undefined || this.nestedPopover === null) {
      return;
    }

    this.nestedPopover.off(PopoverEvent.ClosedOnActivate, this.hide);
    this.nestedPopover.hide();
    this.nestedPopover.destroy();
    this.nestedPopover.getElement().remove();
    this.nestedPopover = null;
    this.flipper?.activate(this.flippableElements);

    /** Nested popover may have been opened either by click or by hover, so no single item is known here */
    this.items.forEach(item => item.toggleExpanded(false));

    this.nestedPopoverTriggerItem?.onChildrenClose();
  }

  /**
   * Creates and displays nested popover for specified item.
   * Is used only on desktop
   * @param item - item to display nested popover by
   */
  protected showNestedPopoverForItem(item: PopoverItem): PopoverDesktop {
    /** Nested popover has no header, so it is named after the item it was opened from */
    const label = item instanceof PopoverItemDefault ? item.title : undefined;

    this.nestedPopover = new PopoverDesktop({
      searchable: item.isChildrenSearchable,
      items: item.children,
      nestingLevel: this.nestingLevel + 1,
      flippable: item.isChildrenFlippable,
      messages: {
        ...this.messages,
        label: label ?? this.messages.label,
      },
    });

    const close = (parent?: boolean): void => {
      if (parent === true) {
        /** Close parent popover as well */
        this.hide();
      } else {
        /** Close only nested popover */
        this.destroyNestedPopoverIfExists();
      }
    };

    /**
     * Close nested popover when item with 'closeOnActivate' property set was clicked
     * parent popover should also be closed
     */
    this.nestedPopover.on(PopoverEvent.ClosedOnActivate, this.hide);

    const nestedPopoverEl = this.nestedPopover.getElement();

    this.nodes.popover.appendChild(nestedPopoverEl);

    this.setTriggerItemPosition(nestedPopoverEl, item);

    /* We need nesting level value in CSS to calculate offset left for nested popover */
    nestedPopoverEl.style.setProperty(CSSVariables.NestingLevel, this.nestedPopover.nestingLevel.toString());

    this.nestedPopover.show();
    this.flipper?.deactivate();

    item.toggleExpanded(true);

    /**
     * Called only once the nested popover is attached to the document and shown, since
     * a consumer's 'onOpen' handler may focus one of its elements (e.g. a custom input) —
     * focus() is a no-op on an element that isn't connected to the document yet.
     */
    item.onChildrenOpen(close);

    return this.nestedPopover;
  }

  /**
   * Deepest popover in the currently open nested chain; itself when nothing is nested
   */
  private get deepestOpenPopover(): PopoverDesktop {
    return this.nestedPopover != null ? this.nestedPopover.deepestOpenPopover : this;
  }

  /**
   * Closes the innermost open nested popover in the chain and returns focus to the item that
   * triggered it.
   * @returns false when there is no nested popover open anywhere in the chain, so the caller
   * can fall back to its own handling (e.g. closing the root popover on Escape)
   */
  private closeDeepestNestedPopover(): boolean {
    if (this.nestedPopover == null) {
      return false;
    }

    if (this.nestedPopover.closeDeepestNestedPopover()) {
      return true;
    }

    const triggerItemEl = this.nestedPopoverTriggerItem?.getElement();

    this.destroyNestedPopoverIfExists();
    triggerItemEl?.focus();

    return true;
  }

  /**
   * Handles the keys the Flipper doesn't own: Escape backs out of the currently open submenu
   * (or closes the whole popover once there is none), ArrowLeft/ArrowRight do the same plus
   * open a submenu, matching the WAI-ARIA menu pattern.
   *
   * Registered only on the root popover (nestingLevel 0, see show()/hide()) and resolves which
   * level of the chain is currently open by itself, so a single listener stays correct
   * regardless of how many nested popovers are open at the time of the keypress.
   * @param event - keydown event to handle
   */
  private handleNestedNavigationKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();

      if (!this.closeDeepestNestedPopover()) {
        this.hide();
      }

      return;
    }

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    const deepest = this.deepestOpenPopover;

    /**
     * Only act while focus is actually on one of the items, so ArrowLeft/ArrowRight keep their
     * native meaning (moving the text cursor) inside the search input or a custom control
     */
    if (!deepest.flippableElements.includes(document.activeElement as HTMLElement)) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      if (this.closeDeepestNestedPopover()) {
        event.preventDefault();
      }

      return;
    }

    const focusedItem = deepest.itemsDefault.find(item => item.isFocused);

    if (focusedItem?.hasChildren === true) {
      event.preventDefault();
      focusedItem.getElement()?.click();
    }
  };

  /**
   * Checks if popover should be opened bottom.
   * It should happen when there is enough space below or not enough space above
   */
  private get shouldOpenBottom(): boolean {
    if (this.nodes.popover === undefined || this.nodes.popover === null) {
      return false;
    }
    const popoverRect = this.nodes.popoverContainer.getBoundingClientRect();
    const scopeElementRect = this.scopeElement.getBoundingClientRect();
    const popoverHeight = this.size.height;
    const popoverPotentialBottomEdge = popoverRect.top + popoverHeight;
    const popoverPotentialTopEdge = popoverRect.top - popoverHeight;
    const bottomEdgeForComparison = Math.min(window.innerHeight, scopeElementRect.bottom);

    return popoverPotentialTopEdge < scopeElementRect.top || popoverPotentialBottomEdge <= bottomEdgeForComparison;
  }

  /**
   * Checks if popover should be opened left.
   * It should happen when there is enough space in the right or not enough space in the left
   */
  private get shouldOpenRight(): boolean {
    if (this.nodes.popover === undefined || this.nodes.popover === null) {
      return false;
    }

    const popoverRect = this.nodes.popover.getBoundingClientRect();
    const scopeElementRect = this.scopeElement.getBoundingClientRect();
    const popoverWidth = this.size.width;
    const popoverPotentialRightEdge = popoverRect.right + popoverWidth;
    const popoverPotentialLeftEdge = popoverRect.left - popoverWidth;
    const rightEdgeForComparison = Math.min(window.innerWidth, scopeElementRect.right);

    return popoverPotentialLeftEdge < scopeElementRect.left || popoverPotentialRightEdge <= rightEdgeForComparison;
  }

  /**
   * Helps to calculate size of popover that is only resolved when popover is displayed on screen.
   * Renders invisible clone of popover to get actual values.
   */
  @cacheable
  // eslint-disable-next-line jsdoc/require-jsdoc -- JSDoc doesn't understand it's a type, not an object
  public get size(): { height: number; width: number } {
    const size = {
      height: 0,
      width: 0,
    };

    if (this.nodes.popover === null) {
      return size;
    }

    const popoverClone = this.nodes.popover.cloneNode(true) as HTMLElement;

    popoverClone.style.visibility = 'hidden';
    popoverClone.style.position = 'absolute';
    popoverClone.style.top = '-1000px';

    popoverClone.classList.add(css.popoverOpened);
    popoverClone.querySelector('.' + css.popoverNested)?.remove();
    document.body.appendChild(popoverClone);

    const container = popoverClone.querySelector('.' + css.popoverContainer) as HTMLElement;

    size.height = container.offsetHeight;
    size.width = container.offsetWidth;
    popoverClone.remove();

    return size;
  }

  /**
   * Returns list of elements available for keyboard navigation.
   */
  private get flippableElements(): HTMLElement[] {
    const result = this.items
      .map((item) => {
        if (item instanceof PopoverItemDefault) {
          return item.getElement();
        }
        if (item instanceof PopoverItemHtml) {
          return item.getControls();
        }
      })
      .flat()
      .filter(item => item !== undefined && item !== null);

    return result;
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
  private toggleItemsTabbable(isTabbable: boolean, elements: HTMLElement[] = this.flippableElements): void {
    const hasRovingTabindex = this.flipper !== undefined && this.movesFocusToItems;

    this.flippableElements.forEach((element) => {
      element.tabIndex = -1;
    });

    if (!isTabbable || elements.length === 0) {
      return;
    }

    if (hasRovingTabindex) {
      elements[0].tabIndex = 0;
    } else {
      elements.forEach((element) => {
        element.tabIndex = 0;
      });
    }
  }

  /**
   * Called on flipper navigation
   */
  private onFlip = (): void => {
    const focusedItem = this.itemsDefault.find(item => item.isFocused);

    focusedItem?.onFocus();

    this.emit(PopoverEvent.ActiveDescendantChanged, focusedItem?.id ?? null);
  };

  /**
   * Adds search to the popover
   */
  private addSearch(): void {
    this.search = new SearchInput({
      items: this.itemsDefault,
      placeholder: this.messages.search,
      label: this.messages.search,
    });

    this.search.on(SearchInputEvent.Search, this.onSearch);

    const searchElement = this.search.getElement();

    searchElement.classList.add(css.search);

    this.nodes.popoverContainer.insertBefore(searchElement, this.nodes.popoverContainer.firstChild);
  }

  /**
   * Handles input inside search field
   * @param data - search input event data
   * @param data.query - search query text
   * @param data.result - search results
   */
  // eslint-disable-next-line jsdoc/require-jsdoc -- JSDoc doesn't understand it's a type, not an object
  private onSearch = (data: { query: string; items: SearchableItem[] }): void => {
    const isEmptyQuery = data.query === '';
    const isNothingFound = data.items.length === 0;

    this.items
      .forEach((item) => {
        let isHidden = false;

        if (item instanceof PopoverItemDefault) {
          isHidden = !data.items.includes(item);
        } else if (item instanceof PopoverItemSeparator || item instanceof PopoverItemHtml) {
          /** Should hide separators if nothing found message displayed or if there is some search query applied */
          isHidden = isNothingFound || !isEmptyQuery;
        }
        item.toggleHidden(isHidden);
      });
    this.toggleNothingFoundMessage(isNothingFound);
    this.announceSearchResults(data.query, data.items.length);

    /** List of elements available for keyboard navigation considering search query applied */
    const flippableElements = data.query === '' ? this.flippableElements : data.items.map(item => (item as PopoverItem).getElement());

    if (this.flipper?.isActivated === true) {
      /** Update flipper items with only visible */
      this.flipper.deactivate();
      this.flipper.activate(flippableElements as HTMLElement[]);

      /**
       * Deactivating dropped every item's tabindex and activating doesn't restore it without
       * a cursor position, which would also steal focus from the search field. Restore it here,
       * scoped to the currently visible items, so Tab still reaches the filtered results.
       */
      this.toggleItemsTabbable(true, flippableElements as HTMLElement[]);
    }
  };

  /**
   * Announces how many items are left after filtering, since the list changes silently otherwise
   * @param query - search query the items were filtered by
   * @param count - number of the items matching the query
   */
  private announceSearchResults(query: string, count: number): void {
    /** Clearing the query is not a result of a user search, nothing to report */
    if (query === '') {
      return;
    }

    window.clearTimeout(this.searchResultsAnnouncementTimeout);

    this.searchResultsAnnouncementTimeout = window.setTimeout(() => {
      if (count === 0) {
        this.announce(this.messages.nothingFound ?? '');

        return;
      }

      const template = count === 1 ? this.messages.result : this.messages.results;

      this.announce((template ?? '').replace('{count}', count.toString()));
    }, SEARCH_RESULTS_ANNOUNCEMENT_DEBOUNCE);
  }

  /**
   * Toggles nothing found message visibility
   * @param isDisplayed - true if the message should be displayed
   */
  private toggleNothingFoundMessage(isDisplayed: boolean): void {
    this.nodes.nothingFoundMessage.classList.toggle(css.nothingFoundMessageDisplayed, isDisplayed);
  }

  /**
   * Set's caret to the item provided by Flipper
   * @param item - HTML element to set the caret to
   */
  private setCaretToItem(this: void, item: HTMLElement): void {
    /**
     * Focus input with micro-delay to ensure DOM is updated
     */
    delay(() => focus(item), FOCUS_DELAY);
  }
}

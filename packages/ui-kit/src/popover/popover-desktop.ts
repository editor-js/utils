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
           * Tab is the popover's own to handle rather than the Flipper's, see handleTabKeyDown().
           * The Flipper would only ever leaf its items, and the ring Tab walks has to take in
           * the search field too, which is not one of them.
           *
           * Note this departs from the WAI-ARIA menu pattern, where Tab leaves the menu
           * altogether: Editor.js wants it to leaf the items. Escape and ArrowLeft both exit,
           * so the popover is not a keyboard trap
           */
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
   * True if the element needs the horizontal arrow keys for itself: anything the user can type
   * into (the arrows move the text cursor there) and a select (they change the picked option)
   * @param element - currently focused element
   */
  private static consumesArrowKeys(element: HTMLElement): boolean {
    return element.isContentEditable
      || element instanceof HTMLInputElement
      || element instanceof HTMLTextAreaElement
      || element instanceof HTMLSelectElement;
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
    /**
     * Recorded on the closed-to-open transition only. Calling show() on a popover that is
     * already open would otherwise replace the opener with the item or the search field that
     * holds the focus now, and closing would then return the focus into the inert popover
     */
    if (!this.isShown) {
      this.previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }

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
     * this popover even learns it should close, and that focus should not be clobbered.
     *
     * Checked against the whole popover element rather than its container: nested popovers are
     * appended next to the container, and the focus may well be in one of them
     */
    const shouldRestoreFocus = document.activeElement !== null && this.nodes.popover.contains(document.activeElement);

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
      this.search.reapplyQuery();
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
      this.search.reapplyQuery();
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

    const nestedPopover = this.showNestedPopoverForItem(item);

    /**
     * Unlike hovering, activating an item is a deliberate 'enter the submenu' action, so the
     * focus follows it. Otherwise the submenu opens with the focus left behind on the trigger:
     * nothing is announced, and it can be neither navigated nor closed with the arrows until
     * the user presses ArrowDown first.
     *
     * Skipped for the popovers that keep the focus where it is (inline ones,
     * see movesFocusToItems), since taking it would drop the selection they act on
     */
    if (this.movesFocusToItems) {
      nestedPopover.focusFirstItem();
    }
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

    /**
     * Handing the keyboard over to the nested popover deactivated the Flipper, which dropped
     * every item's tabindex, and activating it back doesn't restore one without a cursor
     * position. Without this the popover would be left without a single Tab stop and could
     * not be re-entered from the keyboard at all.
     *
     * Focus is deliberately not moved here: hovering another item closes the nested popover
     * too, and the mouse should not steal the focus. The keyboard path restores the cursor
     * itself, see closeDeepestNestedPopover()
     */
    this.toggleItemsTabbable(this.isShown);

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
    /**
     * Recorded here rather than in showNestedItems(), since hovering an item opens a nested
     * popover without going through it. Leaving it unset on that path meant a hover-opened
     * popover could not return the focus to what it was opened from, and fired 'onChildrenClose'
     * on whichever item happened to open a popover by click before it
     */
    this.nestedPopoverTriggerItem = item;

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
   * Called on flipper navigation
   */
  protected override onFlip = (): void => {
    /**
     * Read off the Flipper rather than looked up among the default items: the cursor may as
     * well be on a control of an html item, and that one has to be reported too
     */
    const element = this.flipper?.currentItem ?? null;
    const focusedItem = element !== null ? this.findItemByElement(element) : undefined;

    if (focusedItem instanceof PopoverItemDefault) {
      focusedItem.onFocus();
    }

    this.emit(PopoverEvent.ActiveDescendantChanged, element !== null && element.id !== '' ? element.id : null);
  };

  /**
   * True if the items are laid out in a row, so that the horizontal arrows move along them.
   * Popovers are vertical menus, inline ones are horizontal bars
   */
  protected get isHorizontal(): boolean {
    return false;
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

    const triggerItem = this.nestedPopoverTriggerItem;

    this.destroyNestedPopoverIfExists();
    this.focusItem(triggerItem);

    return true;
  }

  /**
   * Returns the highlight, the real focus and the roving tabindex to the specified item
   * @param item - item to move the keyboard navigation cursor to
   */
  private focusItem(item: PopoverItem | null): void {
    const element = item?.getElement();

    if (element === undefined || element === null) {
      return;
    }

    /** Item is not navigable by the Flipper, at least give it the real focus */
    if (!this.moveCursorTo(element)) {
      element.focus();
    }
  }

  /**
   * Handles the keys the Flipper doesn't own: Escape backs out of the currently open submenu
   * (or closes the whole popover once there is none), ArrowLeft/ArrowRight do the same plus
   * open a submenu, matching the WAI-ARIA menu pattern, and Tab leafs the items of whichever
   * popover of the chain is currently open.
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

    if (event.key === 'Tab') {
      this.deepestOpenPopover.handleTabKeyDown(event);

      return;
    }

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    /**
     * In a horizontal bar these arrows move along the items rather than in and out of submenus.
     * Once a nested popover is open the keyboard belongs to it, and that one is a vertical menu
     */
    if (this.isHorizontal && this.nestedPopover == null) {
      this.flipHorizontally(event);

      return;
    }

    /**
     * Only act while the focus is inside the popover (the whole chain lives in its element) and
     * not in a control that needs the horizontal arrows for itself, so they keep their native
     * meaning of moving the text cursor in the search field, in a custom item's input, or in
     * the contenteditable an inline popover is formatting
     */
    const activeElement = document.activeElement;

    if (!(activeElement instanceof HTMLElement) || !this.nodes.popover.contains(activeElement) || PopoverDesktop.consumesArrowKeys(activeElement)) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      if (this.closeDeepestNestedPopover()) {
        event.preventDefault();
      }

      return;
    }

    const focusedItem = this.deepestOpenPopover.focusedItem;

    if (focusedItem?.hasChildren !== true) {
      return;
    }

    event.preventDefault();

    /** Clicking opens the submenu and moves the focus into it, see showNestedItems() */
    focusedItem.getElement()?.click();
  };

  /**
   * Moves the keyboard navigation cursor along a horizontal bar with ArrowLeft/ArrowRight,
   * as the WAI-ARIA toolbar pattern prescribes
   * @param event - ArrowLeft or ArrowRight keydown event
   */
  private flipHorizontally(event: KeyboardEvent): void {
    /**
     * Shift+arrows extend the text selection. And until the user has entered the bar (with
     * ArrowDown, ArrowUp or Tab) there is no cursor in it: the focus is still in the text the
     * bar acts on, where the horizontal arrows move the caret
     */
    if (event.shiftKey || this.flipper?.hasFocus() !== true) {
      return;
    }

    const activeElement = document.activeElement;
    const isFocusInside = activeElement instanceof HTMLElement && this.nodes.popover.contains(activeElement);

    /** A custom item's text field needs the arrows to move its own caret */
    if (isFocusInside && PopoverDesktop.consumesArrowKeys(activeElement)) {
      return;
    }

    event.preventDefault();

    if (event.key === 'ArrowLeft') {
      this.flipper.flipLeft();
    } else {
      this.flipper.flipRight();
    }

    /**
     * An inline bar only moves the highlight (see movesFocusToItems), but once Tab has put the
     * real focus on one of its items, that focus has to travel along. Otherwise Enter and the
     * screen reader would stay on the item the focus was left on
     */
    if (isFocusInside) {
      this.flipper.currentItem?.focus();
    }
  }

  /**
   * Item the keyboard navigation cursor is on: the Flipper's current one, or the item holding
   * the real focus in a popover that has no Flipper. For an html item, that is one of its controls
   */
  private get focusedItem(): PopoverItemDefault | PopoverItemHtml | undefined {
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = this.flipper?.currentItem ?? activeElement;

    if (element === null) {
      return undefined;
    }

    return this.findItemByElement(element);
  }

  /**
   * Returns the item the specified navigable element belongs to
   * @param element - item root, or a control of an html item
   */
  private findItemByElement(element: HTMLElement): PopoverItemDefault | PopoverItemHtml | undefined {
    for (const item of this.items) {
      if (item instanceof PopoverItemDefault && item.getElement() === element) {
        return item;
      }

      if (item instanceof PopoverItemHtml && item.getControls().includes(element)) {
        return item;
      }
    }

    return undefined;
  }

  /**
   * Walks the popover's Tab ring, wrapping around at its ends.
   *
   * The items share a single roving tabindex, so the browser sees the whole list as one stop
   * and Tab would leave the popover the moment it entered. Editor.js expects Tab to leaf the
   * items instead, so the ring is walked here rather than natively - and it takes in the search
   * field, which is not one of the items the Flipper navigates and would otherwise fall out of
   * reach as soon as the focus moved into the list
   * @param event - Tab keydown event to handle
   */
  private handleTabKeyDown(event: KeyboardEvent): void {
    /**
     * Only the popovers keeping a single Tab stop for the whole list need this. Where every
     * item is an individual stop - inline popovers, or one built with 'flippable: false' -
     * native Tab already walks them and claiming the key here would break that
     */
    if (!this.hasRovingTabindex) {
      return;
    }

    const stops = this.tabRing;
    const active = document.activeElement;
    const currentIndex = active instanceof HTMLElement ? stops.indexOf(active) : -1;

    /** Focus is not on a stop of this ring, so the keypress is none of the popover's business */
    if (currentIndex === -1) {
      return;
    }

    event.preventDefault();

    const step = event.shiftKey ? -1 : 1;

    stops[(currentIndex + step + stops.length) % stops.length].focus();
  }

  /**
   * Stops of the Tab ring, in the document order: the search field, when the popover has one,
   * followed by the items the Flipper is currently navigating. That is the filtered subset
   * while a search query is applied, so the ring never visits an item that is off screen
   */
  private get tabRing(): HTMLElement[] {
    const items = this.flipper?.currentItems ?? [];

    if (this.search === undefined) {
      return items;
    }

    return [this.search.inputElement, ...items];
  }

  /**
   * Moves the keyboard navigation cursor to the first item of the popover
   */
  private focusFirstItem(): void {
    /** Focus of a searchable popover belongs to its search field, items are reached by typing */
    if (this.search !== undefined) {
      return;
    }

    /** A consumer's 'onOpen' handler may have focused an element of its own, don't fight it */
    if (document.activeElement !== null && this.nodes.popover.contains(document.activeElement)) {
      return;
    }

    if (this.flipper !== undefined) {
      this.flipper.focusFirst();

      return;
    }

    /**
     * Built with 'flippable: false', so there is no Flipper to move the cursor. Every item is
     * a Tab stop of its own then, the first one is focused directly, so that the submenu is
     * announced and usable right away rather than leaving the focus on the parent's trigger
     */
    this.flippableElements[0]?.focus({ preventScroll: true });
  }

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
   * While a nested popover is open the keyboard belongs to it, this one stays deactivated
   */
  protected override get isFlipperCursorSyncEnabled(): boolean {
    return this.nestedPopover == null;
  }

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
      /**
       * Noted before the Flipper is restarted: re-filtering can happen while an item rather than
       * the search field holds the focus (adding or removing an item reapplies the query), and
       * restarting the Flipper without a cursor leaves the highlight and the roving tabindex
       * behind on the first item while the real focus stays where the user left it
       */
      const active = document.activeElement;
      const focusedItem = active instanceof HTMLElement && this.nodes.items.contains(active) ? active : null;

      /** Update flipper items with only visible */
      this.flipper.deactivate();
      this.flipper.activate(flippableElements as HTMLElement[]);

      /**
       * Deactivating dropped every item's tabindex and activating doesn't restore it without
       * a cursor position, which would also steal focus from the search field. Restore it here,
       * scoped to the currently visible items, so Tab still reaches the filtered results.
       */
      this.toggleItemsTabbable(true, flippableElements as HTMLElement[]);

      /**
       * Only when an item was focused: typing in the search field must not move the cursor onto
       * an item, since that is what would take the focus away from the query being typed
       */
      if (focusedItem !== null) {
        this.moveCursorTo(focusedItem);
      }
    }
  };

  /**
   * Announces how many items are left after filtering, since the list changes silently otherwise
   * @param query - search query the items were filtered by
   * @param count - number of the items matching the query
   */
  private announceSearchResults(query: string, count: number): void {
    /**
     * Dropped first, so that a pending announcement of the previous query never outlives it -
     * clearing the search box mid-debounce would otherwise still report the stale result count
     */
    window.clearTimeout(this.searchResultsAnnouncementTimeout);

    /** Clearing the query is not a result of a user search, nothing to report */
    if (query === '') {
      return;
    }

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

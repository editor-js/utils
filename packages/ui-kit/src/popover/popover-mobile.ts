import { PopoverAbstract } from './popover-abstract';
import { ScrollLocker } from '../scroll-locker';
import { PopoverHeader } from './components/popover-header';
import { PopoverStatesHistory } from './utils/popover-states-history';
import type { PopoverMobileNodes, PopoverParams, PopoverItemParams } from './types';
import type { PopoverItemDefault } from './components/popover-item';
import { css as popoverItemCls } from './components/popover-item';
import { PopoverItemType } from './types';
import { css } from './popover.const';
import { FOCUSABLE_CONTROLS_SELECTOR } from './components/popover-item/popover-item-html/popover-item-html.const';
import { make, Flipper } from '@editorjs/dom';
import { keyCodes } from '@editorjs/helpers';

/**
 * Elements that can hold the focus inside the popover panel.
 *
 * Everything explicitly taken out of the tab order is excluded, which is what keeps the trap
 * in sync with the roving tabindex of the item list: only the item the Flipper currently
 * points at is a tab stop, so the whole menu counts as one, as the menu pattern prescribes
 */
const FOCUSABLE_SELECTOR = [
  ...FOCUSABLE_CONTROLS_SELECTOR.split(', '),
  '[tabindex]',
].map(selector => `${selector}:not([tabindex="-1"])`).join(', ');

/**
 * Mobile Popover.
 * On mobile devices Popover behaves like a fixed panel at the bottom of screen. Nested item appears like "pages" with the "back" button
 */
export class PopoverMobile extends PopoverAbstract<PopoverMobileNodes> {
  /**
   * ScrollLocker instance
   */
  private scrollLocker = new ScrollLocker();

  /**
   * Reference to popover header if exists
   */
  private header: PopoverHeader | undefined | null;

  /**
   * History of popover states for back navigation.
   * Is used for mobile version of popover,
   * where we can not display nested popover of the screen and
   * have to render nested items in the same popover switching to new state
   */
  private history = new PopoverStatesHistory();

  /**
   * Flag that indicates if popover is hidden
   */
  private isHidden = true;

  /**
   * Element that was focused before the popover was opened.
   * Focus returns to it once the popover closes
   */
  private previouslyFocusedElement: HTMLElement | null = null;

  /**
   * Whether the items currently on screen take part in keyboard navigation.
   * Nested levels opt out of it via children.isFlippable, and since they are rendered into the
   * same panel rather than into a popover of their own, the flag has to travel with the level.
   * The root level's own value comes from the 'flippable' construction param
   */
  private isLevelFlippable: boolean;

  /**
   * Construct the instance
   * @param params - popover params object
   */
  constructor(params: PopoverParams) {
    super(params, {
      [PopoverItemType.Default]: {
        hint: {
          enabled: false,
        },
      },
      [PopoverItemType.Html]: {
        hint: {
          enabled: false,
        },
      },
    });

    this.nodes.overlay = make('div', [css.overlay, css.overlayHidden]);
    this.nodes.popover.insertBefore(this.nodes.overlay, this.nodes.popover.firstChild);

    this.listeners.on(this.nodes.overlay, 'click', () => {
      this.hide();
    });

    /**
     * Popover covers the screen and locks the scroll while it is opened,
     * which is a modal dialog in everything but semantics
     */
    this.nodes.popoverContainer.setAttribute('role', 'dialog');
    this.nodes.popoverContainer.setAttribute('aria-modal', 'true');
    this.updateAccessibleName();

    /**
     * Focusable programmatically, but not a Tab stop: the dialog itself holds the focus when
     * there is nothing inside to put it on (an empty list, or separators only), so that the focus
     * is inside the modal rather than left behind on the page underneath
     */
    this.nodes.popoverContainer.tabIndex = -1;

    /**
     * The item list is a menu, so the arrows navigate it while the Flipper keeps a roving
     * tabindex over the items. Tab is deliberately left out of the allowed keys: it belongs
     * to the dialog's own trap, which loops it between the panel's parts (the header and the
     * menu) rather than between the individual items.
     *
     * A popover built with 'flippable: false' opts out of keyboard navigation altogether, and
     * then every item becomes an individual stop of the trap instead - see toggleItemsTabbable()
     */
    this.isLevelFlippable = params.flippable !== false;

    if (this.isLevelFlippable) {
      this.flipper = new Flipper({
        items: this.flippableElements,
        focusedItemClass: popoverItemCls.focused,
        focusItems: true,
        allowedKeys: [
          keyCodes.UP,
          keyCodes.DOWN,
          keyCodes.ENTER,
        ],
      });
    }

    /* Save state to history for proper navigation between nested and parent popovers */
    this.history.push({
      items: params.items,
      isFlippable: this.isLevelFlippable,
    });
  }

  /**
   * The items share a single Tab stop only while the level they belong to is navigable.
   * A level that opted out is walked by Tab like a plain list instead
   */
  protected override get hasRovingTabindex(): boolean {
    return this.isLevelFlippable && super.hasRovingTabindex;
  }

  /**
   * Open popover
   */
  public show(): void {
    this.nodes.overlay.classList.remove(css.overlayHidden);

    /**
     * Focus should return to whatever the popover was opened from. Recorded on the
     * closed-to-open transition only: calling show() on an opened dialog would otherwise replace
     * the opener with the item focused inside, and closing would then return the focus into the
     * dialog that has just become inert
     */
    if (this.isHidden) {
      this.previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }

    super.show();

    this.scrollLocker.lock();

    if (this.isLevelFlippable) {
      this.flipper?.activate(this.flippableElements);
    }

    this.toggleItemsTabbable(true);

    this.listeners.on(document, 'keydown', this.handleKeyDown as (event: Event) => void, { capture: true });

    this.focusFirstElement();

    this.isHidden = false;
  }

  /**
   * Closes popover
   */
  public hide(): void {
    if (this.isHidden) {
      return;
    }

    /**
     * Focus is only pulled back if it is still where the popover left it. A click on another
     * control, for example, has already moved it there on mousedown, before this popover even
     * learns it should close, and that focus should not be clobbered
     */
    const shouldRestoreFocus = document.activeElement !== null && this.nodes.popoverContainer.contains(document.activeElement);

    super.hide();
    this.nodes.overlay.classList.add(css.overlayHidden);

    this.scrollLocker.unlock();

    this.flipper?.deactivate();
    this.toggleItemsTabbable(false);

    this.listeners.off(document, 'keydown', this.handleKeyDown as (event: Event) => void, { capture: true });

    this.history.reset();
    this.isLevelFlippable = this.history.currentIsFlippable;

    this.isHidden = true;

    if (shouldRestoreFocus) {
      this.previouslyFocusedElement?.focus();
    }
    this.previouslyFocusedElement = null;
  }

  /**
   * Clears memory
   */
  public destroy(): void {
    /**
     * Closed first, so that an opened popover deactivates its Flipper: that one listens to the
     * keys on the document, and would otherwise keep acting on the detached items
     */
    this.hide();

    super.destroy();

    this.scrollLocker.unlock();
  }

  /**
   * Handles displaying nested items for the item
   * @param item – item object to show nested popover for
   */
  protected override showNestedItems(item: PopoverItemDefault): void {
    /**
     * Pushed before the level is rendered, and before onChildrenOpen() below is handed a way to
     * close it: a close arriving synchronously from there would otherwise pop the root state,
     * the only one on the stack at that point, and leave the popover with no state at all
     */
    this.history.push({
      title: item.title,
      items: item.children,
      isFlippable: item.isChildrenFlippable,
    });

    /** Show nested items */
    this.updateItemsAndHeader(item.children, item.title, item.isChildrenFlippable);

    const close = (parent?: boolean): void => {
      if (parent === true) {
        this.hide();
      } else {
        this.history.pop();

        this.updateItemsAndHeader(this.history.currentItems, this.history.currentTitle, this.history.currentIsFlippable);
      }
    };

    item.onChildrenOpen(close);
  }

  /**
   * Elements inside the popover that can be focused, in the document order
   */
  private get focusableElements(): HTMLElement[] {
    return Array.from(
      this.nodes.popoverContainer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter(element => element.offsetParent !== null);
  }

  /**
   * Handles the keys the dialog is responsible for: Escape closes it,
   * Tab is looped so that the focus does not leave the dialog while it is opened
   * @param event - keydown event to handle
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isHidden) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.hide();

      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const elements = this.focusableElements;

    event.preventDefault();

    /** Nothing to move to, the focus stays on the dialog itself, see focusFirstElement() */
    if (elements.length === 0) {
      this.nodes.popoverContainer.focus({ preventScroll: true });

      return;
    }

    this.focusNextStop(elements, event.shiftKey);
  };

  /**
   * Moves the focus to the neighbouring stop of the dialog, looping around its ends.
   *
   * The trap walks the list itself rather than intercepting Tab only at its ends: the browsers
   * do not agree on which elements native Tab visits - WebKit leaves buttons out of the
   * sequence unless full keyboard access is turned on - so leaving the steps in between to
   * them would make the header's back button unreachable on some of them
   * @param elements - stops of the dialog, in the document order
   * @param isBackwards - true when Shift is held, so the focus moves to the previous stop
   */
  private focusNextStop(elements: HTMLElement[], isBackwards: boolean): void {
    const active = document.activeElement;
    const currentIndex = active instanceof HTMLElement ? elements.indexOf(active) : -1;

    /** Focus is somewhere outside the dialog: it comes back in at the end it is heading for */
    if (currentIndex === -1) {
      elements[isBackwards ? elements.length - 1 : 0].focus();

      return;
    }

    const step = isBackwards ? -1 : 1;

    elements[(currentIndex + step + elements.length) % elements.length].focus();
  }

  /**
   * Moves focus inside the dialog once it is opened.
   *
   * The menu is entered at its first item, so that the arrows navigate from there right away.
   * Without a Flipper ('flippable: false'), on a nested level that opted out of keyboard
   * navigation, or with a list that has nothing for it to point at (only separators, for
   * example), the trap's own first stop is used instead. And when there is no stop at all,
   * the dialog itself takes the focus
   */
  private focusFirstElement(): void {
    if (this.flipper !== undefined && this.isLevelFlippable && this.flippableElements.length > 0) {
      this.flipper.focusFirst();

      return;
    }

    const [first] = this.focusableElements;

    /** Popover is already on screen, focusing should not scroll the page to it */
    (first ?? this.nodes.popoverContainer).focus({ preventScroll: true });
  }

  /**
   * Points the popover to the element naming it: the header text of the currently displayed
   * nested items, or the label from messages when the root items are displayed
   */
  private updateAccessibleName(): void {
    const textId = this.header?.textId;

    if (textId !== undefined) {
      this.nodes.popoverContainer.setAttribute('aria-labelledby', textId);

      return;
    }

    this.nodes.popoverContainer.removeAttribute('aria-labelledby');

    if (this.messages.label !== undefined) {
      this.nodes.popoverContainer.setAttribute('aria-label', this.messages.label);
    }
  }

  /**
   * Removes rendered popover items and header and displays new ones
   * @param items - new popover items
   * @param title - new popover header text
   * @param isFlippable - false if the new items opted out of keyboard navigation
   */
  private updateItemsAndHeader(items: PopoverItemParams[], title?: string, isFlippable = true): void {
    /** Re-render header */
    if (this.header !== null && this.header !== undefined) {
      this.header.destroy();
      this.header = null;
    }
    if (title !== undefined) {
      this.header = new PopoverHeader({
        text: title,
        backButtonLabel: this.messages.back,
        onBackButtonClick: () => {
          this.history.pop();

          this.updateItemsAndHeader(this.history.currentItems, this.history.currentTitle, this.history.currentIsFlippable);
        },
      });
      const headerEl = this.header.getElement();

      if (headerEl !== null) {
        this.nodes.popoverContainer.insertBefore(headerEl, this.nodes.popoverContainer.firstChild);
      }
    }

    /** Nested popover is announced by its title, the root one by the label from messages */
    this.updateAccessibleName();

    /** Re-render items. Container is cleared to drop empty radio group wrappers as well */
    this.items.forEach(item => item.getElement()?.remove());
    this.nodes.items.replaceChildren();

    this.items = this.buildItems(items);

    this.renderItems(this.items);

    this.isLevelFlippable = isFlippable;

    if (!this.isHidden) {
      /**
       * Deactivated before being re-activated, so that the Flipper drops its cursor while it
       * still points into the old list - the new one may well be shorter than the position
       * the cursor is left at
       */
      this.flipper?.deactivate();

      /**
       * A level that opted out of keyboard navigation leaves the Flipper deactivated, so it
       * stops claiming the arrows and Enter: an item holding a text input needs those for
       * itself. Its items become individual stops of the panel's Tab trap instead
       */
      if (this.isLevelFlippable) {
        this.flipper?.activate(this.flippableElements);
      }

      /** Element that was focused has just been removed, so focus is moved into the new list */
      this.toggleItemsTabbable(true);
      this.focusFirstElement();
    }
  }
}

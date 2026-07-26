import { PopoverAbstract } from './popover-abstract';
import { ScrollLocker } from '../scroll-locker';
import { PopoverHeader } from './components/popover-header';
import { PopoverStatesHistory } from './utils/popover-states-history';
import type { PopoverMobileNodes, PopoverParams, PopoverItemParams } from './types';
import type { PopoverItemDefault } from './components/popover-item';
import { PopoverItemType } from './types';
import { css } from './popover.const';
import { make } from '@editorjs/dom';

/**
 * Elements that can hold the focus inside the popover
 */
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

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

    /* Save state to history for proper navigation between nested and parent popovers */
    this.history.push({ items: params.items });
  }

  /**
   * Open popover
   */
  public show(): void {
    this.nodes.overlay.classList.remove(css.overlayHidden);

    /** Focus should return to whatever the popover was opened from */
    this.previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    super.show();

    this.scrollLocker.lock();
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

    super.hide();
    this.nodes.overlay.classList.add(css.overlayHidden);

    this.scrollLocker.unlock();
    this.toggleItemsTabbable(false);

    this.listeners.off(document, 'keydown', this.handleKeyDown as (event: Event) => void, { capture: true });

    this.history.reset();

    this.isHidden = true;

    this.previouslyFocusedElement?.focus();
    this.previouslyFocusedElement = null;
  }

  /**
   * Clears memory
   */
  public destroy(): void {
    super.destroy();

    this.scrollLocker.unlock();
  }

  /**
   * Handles displaying nested items for the item
   * @param item – item object to show nested popover for
   */
  protected override showNestedItems(item: PopoverItemDefault): void {
    /** Show nested items */
    this.updateItemsAndHeader(item.children, item.title);

    const close = (parent?: boolean): void => {
      if (parent === true) {
        this.hide();
      } else {
        this.history.pop();

        this.updateItemsAndHeader(this.history.currentItems, this.history.currentTitle);
      }
    };

    item.onChildrenOpen(close);

    this.history.push({
      title: item.title,
      items: item.children,
    });
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

    if (elements.length === 0) {
      return;
    }

    const first = elements[0];
    const last = elements[elements.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !this.nodes.popoverContainer.contains(active))) {
      event.preventDefault();
      last.focus();

      return;
    }

    if (!event.shiftKey && (active === last || !this.nodes.popoverContainer.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  /**
   * Moves focus inside the dialog once it is opened
   */
  private focusFirstElement(): void {
    const [first] = this.focusableElements;

    /** Popover is already on screen, focusing should not scroll the page to it */
    first?.focus({ preventScroll: true });
  }

  /**
   * Items are plain elements, so they need an explicit tabindex to take part in the focus trap.
   * A closed popover stays in the DOM and hence should not be reachable by Tab
   * @param isTabbable - true if the popover is opened
   */
  private toggleItemsTabbable(isTabbable: boolean): void {
    this.items.forEach((item) => {
      const element = item.getElement();

      if (element === null) {
        return;
      }

      element.tabIndex = isTabbable ? 0 : -1;
    });
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
   */
  private updateItemsAndHeader(items: PopoverItemParams[], title?: string): void {
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

          this.updateItemsAndHeader(this.history.currentItems, this.history.currentTitle);
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

    if (!this.isHidden) {
      /** Element that was focused has just been removed, so focus is moved into the new list */
      this.toggleItemsTabbable(true);
      this.focusFirstElement();
    }
  }
}

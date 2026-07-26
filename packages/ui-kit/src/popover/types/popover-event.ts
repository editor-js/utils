/**
 * Event that can be triggered by the Popover
 */
export enum PopoverEvent {
  /**
   * When popover closes
   */
  Closed = 'closed',

  /**
   * When it closes because item with 'closeOnActivate' property set was clicked
   */
  ClosedOnActivate = 'closed-on-activate',

  /**
   * When the item highlighted by keyboard navigation changes.
   * Value is the id of the newly highlighted item's root element, or null when nothing is
   * highlighted (navigation left the list, or the popover closed).
   *
   * Popovers that don't move real DOM focus to their items (e.g. an inline popover acting on
   * a text selection) rely on this event for a consumer to point aria-activedescendant at the
   * highlighted item from whichever element actually holds focus.
   */
  ActiveDescendantChanged = 'active-descendant-changed'
}

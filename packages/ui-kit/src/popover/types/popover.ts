import type { PopoverItemParams } from './popover-item';
import type { PopoverEvent } from './popover-event';

/**
 * Params required to render popover
 */
export interface PopoverParams {
  /**
   * Popover items config
   */
  items: PopoverItemParams[];

  /**
   * Element of the page that creates 'scope' of the popover.
   * Depending on its size popover position will be calculated
   */
  scopeElement?: HTMLElement;

  /**
   * True if popover should contain search field
   */
  searchable?: boolean;

  /**
   * False if keyboard navigation should be disabled.
   * True by default
   */
  flippable?: boolean;

  /**
   * Popover texts overrides
   */
  messages?: PopoverMessages;

  /**
   * CSS class name for popover root element
   */
  class?: string;

  /**
   * Popover nesting level. 0 value means that it is a root popover
   */
  nestingLevel?: number;

  /**
   * True if popover should close when user clicks outside of it. True by default.
   * Set to false to disable closing on outside click.
   */
  closeOnOutsideClick?: boolean;
}

/**
 * Texts used inside popover
 */
export interface PopoverMessages {
  /** Text displayed when search has no results */
  nothingFound?: string;

  /** Search input label */
  search?: string;

  /**
   * Accessible name of the back button that leaves a nested popover.
   * The button is rendered as an icon, so it has no name of its own
   */
  back?: string;

  /**
   * Announced after the items get filtered by the search query, when exactly one item matches.
   * '{count}' is replaced with the number of found items
   */
  result?: string;

  /**
   * Announced after the items get filtered by the search query, when zero or more than one
   * item matches. '{count}' is replaced with the number of found items
   */
  results?: string;

  /**
   * Accessible name of the popover items container (menu or toolbar), and of the dialog the
   * mobile popover is rendered as. Not rendered visually, used by screen readers to announce
   * what the popover is. Defaults to 'Menu', or to 'Toolbar' for the inline popover
   */
  label?: string;
}

/**
 * Events fired by the Popover
 */
export interface PopoverEventMap {
  /**
   * Fired when popover closes
   */
  [PopoverEvent.Closed]: undefined;

  /**
   * Fired when popover closes because item with 'closeOnActivate' property set was clicked
   * Value is the item that was clicked
   */
  [PopoverEvent.ClosedOnActivate]: undefined;

  /**
   * Fired when the item highlighted by keyboard navigation changes.
   * Value is the id of the highlighted item's root element, or null when nothing is highlighted
   */
  [PopoverEvent.ActiveDescendantChanged]: string | null;
}

/**
 * HTML elements required to display popover
 */
export interface PopoverNodes {
  /** Root popover element */
  popover: HTMLElement;

  /** Wraps all the visible popover elements, has background and rounded corners */
  popoverContainer: HTMLElement;

  /** Message displayed when no items found while searching */
  nothingFoundMessage: HTMLElement;

  /** Visually hidden element used to announce dynamic changes to screen readers */
  liveRegion: HTMLElement;

  /** Popover items wrapper */
  items: HTMLElement;
}

/**
 * HTML elements required to display mobile popover
 */
export interface PopoverMobileNodes extends PopoverNodes {
  /** Popover header element */
  header: HTMLElement;

  /** Overlay, displayed under popover on mobile */
  overlay: HTMLElement;
}

import type { PopoverItemParams } from '../types';

/**
 * Represents single states history item
 */
interface PopoverStatesHistoryItem {
  /**
   * Popover title
   */
  title?: string;

  /**
   * Popover items
   */
  items: PopoverItemParams[];

  /**
   * False if the items of this state opted out of keyboard navigation.
   * Undefined is treated as navigable, which is the default for every level
   */
  isFlippable?: boolean;
}

/**
 * Manages items history inside popover. Allows to navigate back in history
 */
export class PopoverStatesHistory {
  /**
   * Previous items states
   */
  private history: PopoverStatesHistoryItem[] = [];

  /**
   * Push new popover state
   * @param state - new state
   */
  public push(state: PopoverStatesHistoryItem): void {
    this.history.push(state);
  }

  /**
   * Pop last popover state
   */
  public pop(): PopoverStatesHistoryItem | undefined {
    return this.history.pop();
  }

  /**
   * Title retrieved from the current state
   */
  public get currentTitle(): string | undefined {
    if (this.history.length === 0) {
      return '';
    }

    return this.history[this.history.length - 1].title;
  }

  /**
   * Items list retrieved from the current state
   */
  public get currentItems(): PopoverItemParams[] {
    if (this.history.length === 0) {
      return [];
    }

    return this.history[this.history.length - 1].items;
  }

  /**
   * Whether the items of the current state take part in keyboard navigation
   */
  public get currentIsFlippable(): boolean {
    if (this.history.length === 0) {
      return true;
    }

    return this.history[this.history.length - 1].isFlippable !== false;
  }

  /**
   * Returns history to initial popover state
   */
  public reset(): void {
    while (this.history.length > 1) {
      this.pop();
    }
  }
}

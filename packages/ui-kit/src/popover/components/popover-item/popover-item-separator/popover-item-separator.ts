import { make } from '@editorjs/dom';
import { PopoverItem } from '../popover-item';
import { css } from './popover-item-separator.const';

/**
 * Represents popover separator node
 */
export class PopoverItemSeparator extends PopoverItem {
  /**
   * Html elements
   */
  private nodes: {
    /**
     * Separator root element
     */
    root: HTMLElement;
    /**
     * Separator line element
     */
    line: HTMLElement;
  };

  /**
   * Constructs the instance
   */
  constructor() {
    super();

    this.nodes = {
      root: make('div', css.container),
      line: make('div', css.line),
    };

    /**
     * Deliberately given no tabindex, not even -1: a focusable separator is a splitter widget
     * by ARIA, which requires aria-valuenow. A plain div is out of the tab order already, and
     * the popover only toggles the tabindex of flippable elements, which separators never are
     */
    this.nodes.root.setAttribute('role', 'separator');

    this.nodes.root.appendChild(this.nodes.line);
  }

  /**
   * Returns popover separator root element
   */
  public getElement(): HTMLElement {
    return this.nodes.root;
  }

  /**
   * Toggles item hidden state
   * @param isHidden - true if item should be hidden
   */
  public toggleHidden(isHidden: boolean): void {
    this.nodes.root.classList.toggle(css.hidden, isHidden);
    this.nodes.root.hidden = isHidden;
  }
}

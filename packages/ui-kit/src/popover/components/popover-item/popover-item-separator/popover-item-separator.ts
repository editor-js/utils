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

    this.nodes.root.setAttribute('role', 'separator');

    /**
     * A separator is not interactive, so it never takes part in the popover's keyboard
     * navigation and stays out of the tab order for the whole of its life
     */
    this.nodes.root.tabIndex = -1;

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
    this.nodes.root?.classList.toggle(css.hidden, isHidden);
  }
}

import type { PopoverHeaderParams } from './popover-header.types';
import * as Dom from '@editorjs/dom';
import { css } from './popover-header.const';
import { IconChevronLeft } from '@codexteam/icons';
import { Listeners, generateId } from '@editorjs/helpers';

/**
 * Represents popover header ui element
 */
export class PopoverHeader {
  /**
   * Listeners util instance
   */
  private listeners = new Listeners();

  /**
   * Header html elements
   */
  private nodes: {
    /**
     * Header root element
     */
    root: HTMLElement;
    /**
     * Header text element
     */
    text: HTMLElement;
    /**
     * Header back button element
     */
    backButton: HTMLElement;
  };

  /**
   * Text displayed inside header
   */
  private readonly text: string;

  /**
   * Back button click handler
   */
  private readonly onBackButtonClick: () => void;

  /**
   * Constructs the instance
   * @param params - popover header params object
   */
  constructor({ text, onBackButtonClick, backButtonLabel }: PopoverHeaderParams) {
    this.text = text;
    this.onBackButtonClick = onBackButtonClick;

    this.nodes = {
      root: Dom.make('div', [css.root]),
      backButton: Dom.make('button', [css.backButton]),
      text: Dom.make('div', [css.text]),
    };
    this.nodes.backButton.setAttribute('type', 'button');

    if (backButtonLabel !== undefined) {
      this.nodes.backButton.setAttribute('aria-label', backButtonLabel);
    }

    this.nodes.backButton.innerHTML = IconChevronLeft;

    /** Icon is decorative, the button is named via aria-label */
    this.nodes.backButton.firstElementChild?.setAttribute('aria-hidden', 'true');

    this.nodes.root.appendChild(this.nodes.backButton);
    this.listeners.on(this.nodes.backButton, 'click', this.onBackButtonClick);

    this.nodes.text.innerText = this.text;
    this.nodes.text.id = generateId(`${css.text}-`);
    this.nodes.root.appendChild(this.nodes.text);
  }

  /**
   * Id of the element holding the header text.
   * Popover references it so that entering a nested popover announces which one was entered
   */
  public get textId(): string {
    return this.nodes.text.id;
  }

  /**
   * Returns popover header root html element
   */
  public getElement(): HTMLElement | null {
    return this.nodes.root;
  }

  /**
   * Destroys the instance
   */
  public destroy(): void {
    this.nodes.root.remove();
    this.listeners.destroy();
  }
}

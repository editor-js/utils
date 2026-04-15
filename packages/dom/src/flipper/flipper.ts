import { DomIterator } from '../domIterator';
import { keyCodes, isFunction } from '@editorjs/helpers';
import { canSetCaret } from '../canSetCaret';

/**
 * Flipper construction options
 */
export interface FlipperOptions {
  /**
   * CSS-modifier for focused item
   */
  focusedItemClass?: string;

  /**
   * If flipping items are the same for all Block (for ex. Toolbox), ypu can pass it on constructing
   */
  items?: HTMLElement[];

  /**
   * Optional callback for button click
   */
  activateCallback?: (item: HTMLElement) => void;

  /**
   * List of keys allowed for handling.
   * Can include codes of the following keys:
   *  - Tab
   *  - Enter
   *  - Arrow up
   *  - Arrow down
   *  - Arrow right
   *  - Arrow left
   * If not specified all keys are enabled
   */
  allowedKeys?: number[];

  /**
   * Callback to set caret to the current element if possible. If not provided, caret is not set
   */
  setCaret?: (item: HTMLElement) => void;
}

/**
 * Flipper is a component that iterates passed items array by TAB or Arrows and clicks it by ENTER
 */
export class Flipper {
  /**
   * True if flipper is currently activated
   */
  public get isActivated(): boolean {
    return this.activated;
  }

  /**
   * Instance of flipper iterator
   */
  private readonly iterator: DomIterator | null = null;

  /**
   * Flag that defines activation status
   */
  private activated = false;

  /**
   * List codes of the keys allowed for handling
   */
  private readonly allowedKeys: number[];

  /**
   * Call back for button click/enter
   */
  private readonly activateCallback: (item: HTMLElement) => void;

  /**
   * Contains list of callbacks to be executed on each flip
   */
  private flipCallbacks: Array<() => void> = [];

  /**
   * Sets caret to provided item. Should be implemented by the end user
   */
  private setCaret?: (item: HTMLElement) => void;

  /**
   * @param options - different constructing settings
   */
  constructor(options: FlipperOptions) {
    this.iterator = new DomIterator(options.items, options.focusedItemClass);
    this.activateCallback = options.activateCallback;
    this.allowedKeys = options.allowedKeys || Flipper.usedKeys;
    this.setCaret = options.setCaret;
  }

  /**
   * Array of keys (codes) that is handled by Flipper
   * Used to:
   *  - preventDefault only for this keys, not all keydowns (@see constructor)
   *  - to skip external behaviours only for these keys, when filler is activated (@see BlockEvents@arrowRightAndDown)
   */
  public static get usedKeys(): number[] {
    return [
      keyCodes.TAB,
      keyCodes.LEFT,
      keyCodes.RIGHT,
      keyCodes.ENTER,
      keyCodes.UP,
      keyCodes.DOWN,
    ];
  }

  /**
   * Active tab/arrows handling by flipper
   * @param items - Some modules (like, InlineToolbar, BlockSettings) might refresh buttons dynamically
   * @param cursorPosition - index of the item that should be focused once flipper is activated
   */
  public activate(items?: HTMLElement[], cursorPosition?: number): void {
    this.activated = true;
    if (items) {
      this.iterator.setItems(items);
    }

    if (cursorPosition !== undefined) {
      this.iterator.setCursor(cursorPosition);
    }

    /**
     * Listening all keydowns on document and react on TAB/Enter press
     * TAB will leaf iterator items
     * ENTER will click the focused item
     *
     * Note: the event should be handled in capturing mode on following reasons:
     * - prevents plugins inner keydown handlers from being called while keyboard navigation
     * - otherwise this handler will be called at the moment it is attached which causes false flipper firing (see https://techread.me/js-addeventlistener-fires-for-past-events/)
     */
    document.addEventListener('keydown', this.onKeyDown, true);
  }

  /**
   * Disable tab/arrows handling by flipper
   */
  public deactivate(): void {
    this.activated = false;
    this.dropCursor();

    document.removeEventListener('keydown', this.onKeyDown);
  }

  /**
   * Focus first item
   */
  public focusFirst(): void {
    this.dropCursor();
    this.flipRight();
  }

  /**
   * Focuses previous flipper iterator item
   */
  public flipLeft(): void {
    this.iterator.previous();
    this.flipCallback();
  }

  /**
   * Focuses next flipper iterator item
   */
  public flipRight(): void {
    this.iterator.next();
    this.flipCallback();
  }

  /**
   * Return true if some button is focused
   */
  public hasFocus(): boolean {
    return !!this.iterator.currentItem;
  }

  /**
   * Registeres function that should be executed on each navigation action
   * @param cb - function to execute
   */
  public onFlip(cb: () => void): void {
    this.flipCallbacks.push(cb);
  }

  /**
   * Unregisteres function that is executed on each navigation action
   * @param cb - function to stop executing
   */
  public removeOnFlip(cb: () => void): void {
    this.flipCallbacks = this.flipCallbacks.filter(fn => fn !== cb);
  }

  /**
   * Drops flipper's iterator cursor
   * @see DomIterator#dropCursor
   */
  private dropCursor(): void {
    this.iterator.dropCursor();
  }

  /**
   * KeyDown event handler
   * @param event - keydown event
   */
  private onKeyDown = (event: KeyboardEvent): void => {
    const isReady = this.isEventReadyForHandling(event);

    if (!isReady) {
      return;
    }

    const isShiftKey = event.shiftKey;

    /**
     * If shift key is pressed, do nothing
     * Allows to select next/prev lines of text using keyboard
     */
    if (isShiftKey === true) {
      return;
    }

    /**
     * Prevent only used keys default behaviour
     * (allows to navigate by ARROW DOWN, for example)
     */
    if (Flipper.usedKeys.includes(event.keyCode)) {
      event.preventDefault();
    }

    switch (event.keyCode) {
      case keyCodes.TAB:
        this.handleTabPress(event);
        break;
      case keyCodes.LEFT:
      case keyCodes.UP:
        this.flipLeft();
        break;
      case keyCodes.RIGHT:
      case keyCodes.DOWN:
        this.flipRight();
        break;
      case keyCodes.ENTER:
        this.handleEnterPress(event);
        break;
    }
  };

  /**
   * This function is fired before handling flipper keycodes
   * The result of this function defines if it is need to be handled or not
   * @param event - keydown keyboard event
   */
  private isEventReadyForHandling(event: KeyboardEvent): boolean {
    return this.activated && this.allowedKeys.includes(event.keyCode);
  }

  /**
   * When flipper is activated tab press will leaf the items
   * @param event - tab keydown event
   */
  private handleTabPress(event: KeyboardEvent): void {
    /** this property defines leaf direction */
    const shiftKey = event.shiftKey;
    const direction = shiftKey ? DomIterator.directions.LEFT : DomIterator.directions.RIGHT;

    switch (direction) {
      case DomIterator.directions.RIGHT:
        this.flipRight();
        break;
      case DomIterator.directions.LEFT:
        this.flipLeft();
        break;
    }
  }

  /**
   * Enter press will click current item if flipper is activated
   * @param event - enter keydown event
   */
  private handleEnterPress(event: KeyboardEvent): void {
    if (!this.activated) {
      return;
    }

    if (this.iterator.currentItem) {
      /**
       * Stop Enter propagation only if flipper is ready to select focused item
       */
      event.stopPropagation();
      event.preventDefault();
      this.iterator.currentItem.click();
    }

    if (isFunction(this.activateCallback)) {
      this.activateCallback(this.iterator.currentItem);
    }
  }

  /**
   * Fired after flipping in any direction
   */
  private flipCallback(): void {
    this.setCaretToCurrentItem();

    if (this.iterator.currentItem) {
      this.iterator.currentItem.scrollIntoViewIfNeeded();
    }

    this.flipCallbacks.forEach(cb => cb());
  }

  /**
   * Sets caret to the current item if setCaret callback is provided
   */
  private setCaretToCurrentItem(): void {
    const currentItem = this.iterator.currentItem;

    if (currentItem === null || this.setCaret === undefined || !canSetCaret(currentItem)) {
      return;
    }

    this.setCaret(currentItem);
  }
}

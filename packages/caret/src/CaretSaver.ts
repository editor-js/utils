import { make } from '@editorjs/dom';

/**
 * Helper for saving and restoring caret position
 */
export default class Caret {
  /**
   * Returns the first range
   * @returns range of the caret if it exists, null otherwise
   */
  private static get range(): Range | null {
    const selection = window.getSelection();

    return selection && selection.rangeCount ? selection.getRangeAt(0) : null;
  }

  /**
   * The <span> for caret saving/restoring
   */
  private savedFakeCaret: HTMLElement | undefined;

  /**
   * Store internal properties
   */
  constructor() {
    /**
     * The hidden <span> for caret saving/restoring
     */
    this.savedFakeCaret = undefined;
  }

  /**
   * Saves caret position using hidden <span>
   */
  public save(): void {
    const range = Caret.range;
    const cursor = make('span');

    cursor.hidden = true;

    if (!range) {
      return;
    }
    range.insertNode(cursor);

    this.savedFakeCaret = cursor;
  }

  /**
   * Restores the caret position saved by the save() method
   */
  public restore(): void {
    if (!this.savedFakeCaret) {
      return;
    }

    const sel = window.getSelection();

    if (!sel) {
      return;
    }

    const range = new Range();

    range.setStartAfter(this.savedFakeCaret);
    range.setEndAfter(this.savedFakeCaret);

    sel.removeAllRanges();
    sel.addRange(range);

    /**
     * A little timeout uses to allow browser to set caret after element before we remove it.
     */
    setTimeout(() => {
      this.savedFakeCaret?.remove();
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    }, 150);
  }
}

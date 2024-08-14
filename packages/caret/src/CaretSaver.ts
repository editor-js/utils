import { make } from '@editorjs/dom';

/**
 * Helper for saving and restoring caret position
 */
export class CaretSaver {
  /**
   * Returns the first range
   * @returns range of the caret if it exists, null otherwise
   */
  private static get range(): Range | null {
    const selection = window.getSelection();

    return selection && selection.rangeCount ? selection.getRangeAt(0) : null;
  }

  /**
   * Saves caret position using hidden <span>
   * @returns function for resoring the caret
   */
  public save(): () => void {
    const range = CaretSaver.range;
    const cursor = make('span');

    cursor.id = 'cursor';

    cursor.hidden = true;

    if (!range) {
      return;
    }
    range.insertNode(cursor);

    return () => this.restore();
  }

  /**
   * Restores the caret position saved by the save() method
   */
  private restore(): void {
    const caretAnchor = document.getElementById('caret');

    if (caretAnchor === null) {
      return;
    }

    const sel = window.getSelection();

    if (!sel) {
      return;
    }

    const range = new Range();

    range.setStartAfter(caretAnchor);
    range.setEndAfter(caretAnchor);

    sel.removeAllRanges();
    sel.addRange(range);

    /**
     * A little timeout uses to allow browser to set caret after element before we remove it.
     */
    setTimeout(() => {
      caretAnchor.remove();
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    }, 150);
  }
}

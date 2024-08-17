import { make } from '@editorjs/dom';
import { getRange } from '../getRange/getRange';

/**
 * Saves caret position using hidden <span>
 * @returns function for resoring the caret
 */
export function save(): () => void {
  const range = getRange();
  const caret = make('span');

  caret.id = 'cursor';

  caret.hidden = true;

  if (!range) {
    return;
  }
  range.insertNode(caret);

  /**
   * Return funciton that will restore caret and delete temporary span element
   */
  return function restore(): void {
    const sel = window.getSelection();

    if (!sel) {
      return;
    }

    range.setStartAfter(caret);
    range.setEndAfter(caret);

    sel.removeAllRanges();
    sel.addRange(range);

    /**
     * A little timeout uses to allow browser to set caret after element before we remove it.
     */
    setTimeout(() => {
      caret.remove();
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    }, 150);
  };
}

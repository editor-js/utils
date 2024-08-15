import { make } from '@editorjs/dom';
import { getRange } from './getRange';

/**
 * Restores the caret position saved by the save() method
 */
function restore(): void {
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

/**
 * Saves caret position using hidden <span>
 * @returns function for resoring the caret
 */
export function save(): () => void {
  const range = getRange();
  const cursor = make('span');

  cursor.id = 'cursor';

  cursor.hidden = true;

  if (!range) {
    return;
  }
  range.insertNode(cursor);

  return () => restore();
}

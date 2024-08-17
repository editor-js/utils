import { getDeepestNode, isEmpty, isNativeInput } from '@editorjs/dom';
import { getCaretNodeAndOffset } from '../getCaretNodeAndOffset/getCaretNodeAndOffset';
import { checkContenteditableSliceForEmptiness } from '../checkContenteditableSliceForEmptiness/checkContenteditableSliceForEmptiness';

/**
 * Checks if caret is at the start of the passed input
 *
 * Cases:
 * Native input:
 * - if offset is 0, caret is at the start
 * Contenteditable:
 * - caret at the first text node and offset is 0 — caret is at the start
 * - caret not at the first text node — we need to check left siblings for emptiness
 * - caret offset > 0, but all left part is visible (nbsp) — caret is not at the start
 * - caret offset > 0, but all left part is invisible (whitespaces) — caret is at the start
 * @param input - input where caret should be checked
 */
export function isCaretAtStartOfInput(input: HTMLElement): boolean {
  const firstNode = getDeepestNode(input);

  if (firstNode === null || isEmpty(input)) {
    return true;
  }

  /**
   * In case of native input, we simply check if offset is 0
   */
  if (isNativeInput(firstNode)) {
    return (firstNode as HTMLInputElement).selectionEnd === 0;
  }

  if (isEmpty(input)) {
    return true;
  }

  const [caretNode, caretOffset] = getCaretNodeAndOffset();

  /**
   * If there is no selection, caret is not at the start
   */
  if (caretNode === null) {
    return false;
  }

  /**
   * If there is nothing visible to the left of the caret, it is considered to be at the start
   */
  return checkContenteditableSliceForEmptiness(input, caretNode, caretOffset, 'left');
}

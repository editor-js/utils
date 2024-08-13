import { getDeepestNode, isNativeInput, checkContenteditableSliceForEmptiness } from '@utils/dom/src';
import { getCaretNodeAndOffset } from './getCaretNodeAndOffset';
/**
 * Checks if caret is at the end of the passed input
 *
 * Cases:
 * Native input:
 * - if offset is equal to value length, caret is at the end
 * Contenteditable:
 * - caret at the last text node and offset is equal to text length — caret is at the end
 * - caret not at the last text node — we need to check right siblings for emptiness
 * - caret offset < text length, but all right part is visible (nbsp) — caret is at the end
 * - caret offset < text length, but all right part is invisible (whitespaces) — caret is at the end
 * @param input - input where caret should be checked
 */
export function isCaretAtEndOfInput(input: HTMLElement): boolean {
  const lastNode = getDeepestNode(input, true);

  if (lastNode === null) {
    return true;
  }

  /**
   * In case of native input, we simply check if offset is equal to value length
   */
  if (isNativeInput(lastNode)) {
    return (lastNode as HTMLInputElement).selectionEnd === (lastNode as HTMLInputElement).value.length;
  }

  const [caretNode, caretOffset] = getCaretNodeAndOffset();

  /**
   * If there is no selection, caret is not at the end
   */
  if (caretNode === null) {
    return false;
  }

  /**
   * If there is nothing visible to the right of the caret, it is considered to be at the end
   */
  return checkContenteditableSliceForEmptiness(input, caretNode, caretOffset, 'right');
}

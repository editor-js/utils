import { fragmentToString } from '@editorjs/dom';

/**
 * Returns slice of the contenteditable html element from caret position to the start or end (depending on direction)
 * @param contenteditable - The contenteditable element containing the nodes.
 * @param fromNode - The starting node to check from.
 * @param offsetInsideNode - The offset inside the starting node.
 * @param direction - The direction to check ('left' or 'right').
 * @param extract - should we remove from element extracted part
 * @returns true if adjacent content is empty, false otherwise.
 */
export function getContenteditableSlice(contenteditable: HTMLElement, fromNode: Node, offsetInsideNode: number, direction: 'left' | 'right', extract: boolean = false): string {
  const range = document.createRange();

  /**
   * In case of "left":
   * Set range from the start of the contenteditable to the passed offset
   */
  if (direction === 'left') {
    range.setStart(contenteditable, 0);
    range.setEnd(fromNode, offsetInsideNode);

  /**
   * In case of "right":
   * Set range from the passed offset to the end of the contenteditable
   */
  } else {
    range.setStart(fromNode, offsetInsideNode);
    range.setEnd(contenteditable, contenteditable.childNodes.length);
  }

  /**
   * Check if we should extract content from the range
   */
  if (extract === true) {
    const textContent = range.extractContents();

    return fragmentToString(textContent);
  }

  /**
   * Clone the range's content and check its text content
   */
  const clonedContent = range.cloneContents();
  const tempDiv = document.createElement('div');

  tempDiv.appendChild(clonedContent);

  const textContent = tempDiv.textContent ?? '';

  /**
   * In HTML there are two types of whitespaces:
   * - visible (&nbsp;)
   * - invisible (trailing spaces, tabs, etc.)
   *
   * If text contains only invisible whitespaces, it is considered to be empty
   */
  return textContent;
}

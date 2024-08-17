import { isCollapsedWhitespaces } from '@editorjs/dom';
import { getContenteditableSlice } from '../getContenteditableSlice/getContenteditableSlice';

/**
 * Checks content at left or right of the passed node for emptiness.
 * @param contenteditable - The contenteditable element containing the nodes.
 * @param fromNode - The starting node to check from.
 * @param offsetInsideNode - The offset inside the starting node.
 * @param direction - The direction to check ('left' or 'right').
 * @returns true if adjacent content is empty, false otherwise.
 */
export function checkContenteditableSliceForEmptiness(contenteditable: HTMLElement, fromNode: Node, offsetInsideNode: number, direction: 'left' | 'right'): boolean {
  /**
   * Get content editable slice
   */
  const textContent = getContenteditableSlice(contenteditable, fromNode, offsetInsideNode, direction);

  /**
   * Check extracted slice for emptiness
   */
  return isCollapsedWhitespaces(textContent);
}

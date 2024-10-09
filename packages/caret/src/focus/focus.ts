import { isNativeInput } from '@editorjs/dom';

/**
 * Set focus to contenteditable or native input element
 * @param element - element where to set focus
 * @param atStart - where to set focus: at the start or at the end
 */
export function focus(element: HTMLElement, atStart: boolean = true): void {
  /** If element is native input */
  if (isNativeInput(element)) {
    element.focus();
    const position = atStart ? 0 : element.value.length;

    element.setSelectionRange(position, position);
  } else {
    const range = document.createRange();
    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    /**
     * Helper function to create a new text node and set the caret
     * @param parent - parent element to append the text node
     * @param prepend
     */
    const createAndFocusTextNode = (parent: HTMLElement | ChildNode, prepend = false): void => {
      const textNode = document.createTextNode('');

      if (prepend) {
        parent.insertBefore(textNode, parent.firstChild);
      } else {
        parent.appendChild(textNode);
      }
      range.setStart(textNode, 0);
      range.setEnd(textNode, 0);
    };

    /**
     * Helper for checking for null and undefined
     * @param v - value to check
     */
    const isDefinedAndNotNull = <T>(v: T): v is T => v !== undefined && v !== null;

    /**
     * We need to set focus at start/end to the text node inside an element
     */

    let childNodes = element.childNodes;
    let nodeToFocus = atStart ? childNodes[0] : childNodes[childNodes.length - 1];

    if (isDefinedAndNotNull(nodeToFocus)) {
      /**
       * Ensure the nodeToFocus is a text node,
       * if it's not, drill down to find a text node
       */
      while (isDefinedAndNotNull(nodeToFocus) && nodeToFocus.nodeType !== Node.TEXT_NODE) {
        nodeToFocus = atStart ? nodeToFocus.firstChild : nodeToFocus.lastChild;
      }

      /**
       * If a text node is found, place the caret
       */
      if (isDefinedAndNotNull(nodeToFocus) && nodeToFocus.nodeType === Node.TEXT_NODE) {
        const length = nodeToFocus.textContent?.length ?? 0;
        const position = atStart ? 0 : length;

        range.setStart(nodeToFocus, position);
        range.setEnd(nodeToFocus, position);
      } else {
        /**
         * If no text node is found, create one and set focus
         */
        createAndFocusTextNode(element, atStart);
      }
    } else {
      /**
       * If the element is empty, create a text node and place the caret at the start
       */
      createAndFocusTextNode(element);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }
}

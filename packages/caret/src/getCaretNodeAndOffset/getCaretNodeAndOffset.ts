/**
 * Returns TextNode containing a caret and a caret offset in it
 * Returns null if there is no caret set
 *
 * Handles a case when focusNode is an ElementNode and focusOffset is a child index,
 * returns child node with focusOffset index as a new focusNode
 */
export function getCaretNodeAndOffset(): [ Node | null, number ] {
  const selection = window.getSelection();

  if (selection === null) {
    return [null, 0];
  }

  let focusNode = selection.focusNode;
  let focusOffset = selection.focusOffset;

  if (focusNode === null) {
    return [null, 0];
  }

  /**
   * Case when focusNode is an Element (or Document). In this case, focusOffset is a child index.
   * We need to return child with focusOffset index as a new focusNode.
   *
   * <div>|hello</div> <---- Selection references to <div> instead of text node
   *
   *
   */
  if (focusNode.nodeType !== Node.TEXT_NODE && focusNode.childNodes.length > 0) {
    /**
     * In normal cases, focusOffset is a child index.
     */
    if (focusNode.childNodes[focusOffset] !== undefined) {
      focusNode = focusNode.childNodes[focusOffset];
      focusOffset = 0;
    /**
     * But in Firefox, focusOffset can be 1 with the single child.
     */
    } else {
      focusNode = focusNode.childNodes[focusOffset - 1];
      if (focusNode.textContent !== null) {
        focusOffset = focusNode.textContent.length;
      }
    }
  }

  return [focusNode, focusOffset];
}

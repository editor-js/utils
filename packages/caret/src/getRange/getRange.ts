/**
 * Returns the first range
 * @returns range of the caret if it exists, null otherwise
 */
export function getRange(): Range | null {
  const selection = window.getSelection();

  return selection && selection.rangeCount ? selection.getRangeAt(0) : null;
}

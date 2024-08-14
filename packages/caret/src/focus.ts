/**
 * Set focus to contenteditable or native input element
 * @param element - element where to set focus
 * @param atStart - where to set focus: at the start or at the end
 */
export function focus(element: HTMLElement, atStart: boolean = true): void {
  const range = document.createRange();
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  range.selectNodeContents(element);
  range.collapse(atStart);

  selection.removeAllRanges();
  selection.addRange(range);
}

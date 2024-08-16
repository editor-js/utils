/**
 * Set focus to contenteditable or native input element
 * @param element - element where to set focus
 * @param atStart - where to set focus: at the start or at the end
 */
export function focus(element: HTMLElement, atStart: boolean = true): void {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    // Если элемент является нативным input или textarea
    element.focus();
    const position = atStart ? 0 : element.value.length;

    element.setSelectionRange(position, position);
  } else {
    // Если элемент является contenteditable
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
}

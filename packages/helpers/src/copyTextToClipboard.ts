/**
 * Copies passed text to the clipboard
 * @param text - text to copy
 */
export function copyTextToClipboard(text): void {
  const el = document.createElement('div');

  el.style.position = 'absolute';
  el.style.left = '-999px';
  el.style.bottom = '-999px';
  el.innerHTML = text;

  document.body.appendChild(el);

  const selection = window.getSelection();
  const range = document.createRange();

  range.selectNode(el);

  if (selection === null) {
    throw new Error('Cannot copy text to clipboard');
  }

  selection.removeAllRanges();
  selection.addRange(range);

  document.execCommand('copy');
  document.body.removeChild(el);
}

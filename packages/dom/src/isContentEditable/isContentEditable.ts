/**
 * Check if passed element is contenteditable
 * @param element - html element to check
 * @returns true if element is contentEditable, false otherwise
 */
export function isContentEditable(element: HTMLElement): boolean {
  return element.contentEditable === 'true';
}

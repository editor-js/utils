/**
 * Append element or a couple to the beginning of the parent elements
 * @param parent - where to append
 * @param elements - element or elements list
 */
export function prepend(parent: Element, elements: Element | Element[]): void {
  if (Array.isArray(elements)) {
    elements = elements.reverse();
    elements.forEach(el => parent.prepend(el));
  } else {
    parent.prepend(elements);
  }
}

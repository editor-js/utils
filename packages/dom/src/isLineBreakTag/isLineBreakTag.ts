/**
 * Check if element is BR or WBR
 * @param element - element to check
 * @returns boolean that represents if element is a line break tag
 */
export function isLineBreakTag(element: HTMLElement): element is HTMLBRElement {
  return [
    'BR',
    'WBR',
  ].includes(element.tagName);
}

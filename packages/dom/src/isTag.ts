/**
 * Check if passed tag has no closed tag
 * @param tag - element to check
 * @returns boolean that represents if element is a single tag
 */
export function isSingleTag(tag: HTMLElement): boolean {
  return [
    'AREA',
    'BASE',
    'BR',
    'COL',
    'COMMAND',
    'EMBED',
    'HR',
    'IMG',
    'INPUT',
    'KEYGEN',
    'LINK',
    'META',
    'PARAM',
    'SOURCE',
    'TRACK',
    'WBR',
  ].includes(tag.tagName);
}

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

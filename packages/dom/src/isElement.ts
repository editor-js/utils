import { isNumber } from '@utils/helpers/src';

/**
 * Check if object is DOM node
 * @param node - object to check
 * @returns true if node is Element, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isElement(node: any): node is Element {
  if (isNumber(node)) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return (Boolean(node)) && (Boolean(node.nodeType)) && node.nodeType === Node.ELEMENT_NODE;
}

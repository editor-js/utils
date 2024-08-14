import { isNumber } from '@editorjs/helpers';

/**
 * Check if object is DocumentFragment node
 * @param node - object to check
 * @returns true if node is DocumentFragment, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFragment(node: any): node is DocumentFragment {
  if (isNumber(node)) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return (Boolean(node)) && (Boolean(node.nodeType)) && node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
}

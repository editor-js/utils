import { isLineBreakTag } from './isLineBreakTag';
import { isElement } from './isElement';
import { isNativeInput } from './isNativeInput';
import { isSingleTag } from './isSingleTag';

/**
 * Checks node if it is empty
 * @description Method checks simple Node without any childs for emptiness
 * If you have Node with 2 or more children id depth, you better use {@link Dom#isEmpty} method
 * @param node - node to check
 * @param [ignoreChars] - char or substring to treat as empty
 * @returns true if it is empty
 */
export function isNodeEmpty(node: Node, ignoreChars?: string): boolean {
  let nodeText: string = '';

  if (isSingleTag(node as HTMLElement) && !isLineBreakTag(node as HTMLElement)) {
    return false;
  }

  if (isElement(node) && isNativeInput(node)) {
    nodeText = (node as HTMLInputElement).value;
  } else {
    if (node.textContent !== null) {
      nodeText = node.textContent.replace('\u200B', '');
    }
  }

  if (ignoreChars !== undefined) {
    nodeText = nodeText.replace(new RegExp(ignoreChars, 'g'), '');
  }

  return nodeText.trim().length === 0;
}

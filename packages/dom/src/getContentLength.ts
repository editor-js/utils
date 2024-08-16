import { isNativeInput } from './isNativeInput';

/**
 * Return length of node`s text content
 * @param node - node with content, which length would be checked
 * @returns length of the content of the node
 */
export function getContentLength(node: Node): number {
  if (isNativeInput(node)) {
    return (node as HTMLInputElement).value.length;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return (node as Text).length;
  }

  return node.textContent?.length ?? 0;
}

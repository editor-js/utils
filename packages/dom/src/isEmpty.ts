import { isLeaf } from './isLeaf';
import { isNodeEmpty } from './isNodeEmpty';

/**
 * breadth-first search (BFS)
 * {@link https://en.wikipedia.org/wiki/Breadth-first_search}
 * @description Pushes to stack all DOM leafs and checks for emptiness
 * @param node - node to check
 * @param [ignoreChars] - char or substring to treat as empty
 * @returns true if node is empty (considering ignore chars), false otherwise
 */
export function isEmpty(node: Node, ignoreChars?: string): boolean {
  /**
   * Normalize node to merge several text nodes to one to reduce tree walker iterations
   */
  node.normalize();

  const treeWalker = [node];

  while (treeWalker.length > 0) {
    const newNode = treeWalker.shift();

    if (!newNode) {
      continue;
    }

    node = newNode;

    if (isLeaf(node) && !isNodeEmpty(node, ignoreChars)) {
      return false;
    }

    treeWalker.push(...Array.from(node.childNodes));
  }

  return true;
}

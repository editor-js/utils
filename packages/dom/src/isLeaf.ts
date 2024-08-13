/**
 * checks node if it is doesn't have any child nodes
 * @param node - node to check
 * @returns true if node is leaf of the node tree, false otherwise
 */
export function isLeaf(node: Node): boolean {
  if (node === null) {
    return false;
  }

  return node.childNodes.length === 0;
}

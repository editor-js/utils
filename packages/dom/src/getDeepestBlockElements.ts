import { containsOnlyInlineElements } from './containsOnlyInlineElements';

/**
 * Find and return all block elements in the passed parent (including subtree)
 * @param parent - root element
 * @returns deeperst block elements
 */
export function getDeepestBlockElements(parent: HTMLElement): HTMLElement[] {
  if (containsOnlyInlineElements(parent)) {
    return [parent];
  }

  return Array.from(parent.children).reduce((result, element) => {
    return [...result, ...getDeepestBlockElements(element as HTMLElement)];
  }, []);
}

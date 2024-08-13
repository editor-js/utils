import { isNumber, isString } from '@editorjs/utils/helpers';

/**
 * Swap two elements in parent
 * @param el1 - first element that would be swapped with second
 * @param el2 - second element that would be swapped with first
 * @deprecated
 */
function swap(el1: HTMLElement, el2: HTMLElement): void {
  // create marker element and insert it where el1 is
  const temp = document.createElement('div');
  const parent = el1.parentNode;

  if (parent !== null) {
    parent.insertBefore(temp, el1);

    // move el1 to right before el2
    parent.insertBefore(el1, el2);

    // move el2 to right before where el1 used to be
    parent.insertBefore(el2, temp);

    // remove temporary marker node
    parent.removeChild(temp);
  }
}

/**
 * Returns CSS selector for all text inputs
 */
function allInputsSelector(): string {
  const allowedInputTypes = ['text', 'password', 'email', 'number', 'search', 'tel', 'url'];

  return '[contenteditable=true], textarea, input:not([type]), '
    + allowedInputTypes.map(type => `input[type="${type}"]`).join(', ');
}

/**
 * Find all contenteditable, textarea and editable input elements passed holder contains
 * @param holder - element where to find inputs
 */
function findAllInputs(holder: HTMLElement): HTMLElement[] {
  return Array.from(holder.querySelectorAll(allInputsSelector()))
    /**
     * If contenteditable element contains block elements, treat them as inputs.
     */
    .reduce((result, input) => {
      if (isNativeInput(input) || containsOnlyInlineElements(input)) {
        return [...result, input as HTMLElement];
      }

      return [...result, ...getDeepestBlockElements(input)];
    }, []);
}

/**
 * Search for deepest node which is Leaf.
 * Leaf is the vertex that doesn't have any child nodes
 * @description Method recursively goes throw the all Node until it finds the Leaf
 * @param node - root Node. From this vertex we start Deep-first search
 *                      {@link https://en.wikipedia.org/wiki/Depth-first_search}
 * @param [atLast] - find last text node
 * @returns - it can be text Node or Element Node, so that caret will able to work with it
 *            Can return null if node is Document or DocumentFragment, or node is not attached to the DOM
 */
function getDeepestNode(node: Node, atLast = false): Node | null {
  /**
   * Current function have two directions:
   * - starts from first child and every time gets first or nextSibling in special cases
   * - starts from last child and gets last or previousSibling
   */
  const child = atLast ? 'lastChild' : 'firstChild';
  const sibling = atLast ? 'previousSibling' : 'nextSibling';

  if (node && node.nodeType === Node.ELEMENT_NODE && node[child]) {
    let nodeChild = node[child] as Node;

    /**
     * special case when child is single tag that can't contain any content
     */
    if (
      isSingleTag(nodeChild as HTMLElement)
      && !isNativeInput(nodeChild)
      && !isLineBreakTag(nodeChild as HTMLElement)
    ) {
      /**
       * 1) We need to check the next sibling. If it is Node Element then continue searching for deepest
       * from sibling
       *
       * 2) If single tag's next sibling is null, then go back to parent and check his sibling
       * In case of Node Element continue searching
       *
       * 3) If none of conditions above happened return parent Node Element
       */
      if (nodeChild[sibling]) {
        nodeChild = nodeChild[sibling];
      } else if (nodeChild.parentNode !== null && nodeChild.parentNode[sibling]) {
        nodeChild = nodeChild.parentNode[sibling];
      } else {
        return nodeChild.parentNode;
      }
    }

    return this.getDeepestNode(nodeChild, atLast);
  }

  return node;
}

/**
 * Check if object is DOM node
 * @param node - object to check
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isElement(node: any): node is Element {
  if (isNumber(node)) {
    return false;
  }

  return node && node.nodeType && node.nodeType === Node.ELEMENT_NODE;
}

/**
 * Check if object is DocumentFragment node
 * @param node - object to check
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFragment(node: any): node is DocumentFragment {
  if (isNumber(node)) {
    return false;
  }

  return node && node.nodeType && node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
}

/**
 * Check if passed element is contenteditable
 * @param element - html element to check
 * @returns
 */
function isContentEditable(element: HTMLElement): boolean {
  return element.contentEditable === 'true';
}

/**
 * Checks target if it is native input
 * @param target - HTML element or string
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isNativeInput(target: any): target is HTMLInputElement | HTMLTextAreaElement {
  const nativeInputs = [
    'INPUT',
    'TEXTAREA',
  ];

  return target && target.tagName ? nativeInputs.includes(target.tagName) : false;
}

/**
 * Checks if we can set caret
 * @param target - target to check
 * @returns
 */
function canSetCaret(target: HTMLElement): boolean {
  let result = true;

  if (isNativeInput(target)) {
    switch (target.type) {
      case 'file':
      case 'checkbox':
      case 'radio':
      case 'hidden':
      case 'submit':
      case 'button':
      case 'image':
      case 'reset':
        result = false;
        break;
    }
  } else {
    result = isContentEditable(target);
  }

  return result;
}

/**
 * Checks node if it is empty
 * @description Method checks simple Node without any childs for emptiness
 * If you have Node with 2 or more children id depth, you better use {@link Dom#isEmpty} method
 * @param node - node to check
 * @param [ignoreChars] - char or substring to treat as empty
 * @returns true if it is empty
 */
function isNodeEmpty(node: Node, ignoreChars?: string): boolean {
  let nodeText;

  if (this.isSingleTag(node as HTMLElement) && !this.isLineBreakTag(node as HTMLElement)) {
    return false;
  }

  if (this.isElement(node) && this.isNativeInput(node)) {
    nodeText = (node as HTMLInputElement).value;
  } else {
    if (node.textContent !== null) {
      nodeText = node.textContent.replace('\u200B', '');
    }
  }

  if (ignoreChars) {
    nodeText = nodeText.replace(new RegExp(ignoreChars, 'g'), '');
  }

  return nodeText.trim().length === 0;
}

/**
 * checks node if it is doesn't have any child nodes
 * @param node - node to check
 * @returns
 */
function isLeaf(node: Node): boolean {
  if (!node) {
    return false;
  }

  return node.childNodes.length === 0;
}

/**
 * breadth-first search (BFS)
 * {@link https://en.wikipedia.org/wiki/Breadth-first_search}
 * @description Pushes to stack all DOM leafs and checks for emptiness
 * @param node - node to check
 * @param [ignoreChars] - char or substring to treat as empty
 * @returns
 */
function isEmpty(node: Node, ignoreChars?: string): boolean {
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

    if (this.isLeaf(node) && !this.isNodeEmpty(node, ignoreChars)) {
      return false;
    }

    if (node.childNodes) {
      treeWalker.push(...Array.from(node.childNodes));
    }
  }

  return true;
}

/**
 * Check if string contains html elements
 * @param str - string to check
 * @returns
 */
function isHTMLString(str: string): boolean {
  const wrapper = make('div');

  wrapper.innerHTML = str;

  return wrapper.childElementCount > 0;
}

/**
 * Return length of node`s text content
 * @param node - node with content
 * @returns
 */
function getContentLength(node: Node): number {
  if (isNativeInput(node)) {
    return (node as HTMLInputElement).value.length;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return (node as Text).length;
  }

  return node.textContent?.length ?? 0;
}

/**
 * Return array of names of block html elements
 * @returns
 */
function blockElements(): string[] {
  return [
    'address',
    'article',
    'aside',
    'blockquote',
    'canvas',
    'div',
    'dl',
    'dt',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hgroup',
    'hr',
    'li',
    'main',
    'nav',
    'noscript',
    'ol',
    'output',
    'p',
    'pre',
    'ruby',
    'section',
    'table',
    'tbody',
    'thead',
    'tr',
    'tfoot',
    'ul',
    'video',
  ];
}

/**
 * Check if passed content includes only inline elements
 * @param data - element or html string
 * @returns
 */
function containsOnlyInlineElements(data: string | Element): boolean {
  let wrapper: HTMLElement;

  if (isString(data)) {
    wrapper = document.createElement('div');
    wrapper.innerHTML = data;
  } else {
    wrapper = data;
  }

  const check = (element: HTMLElement): boolean => {
    return !blockElements().includes(element.tagName.toLowerCase())
      && Array.from(element.children).every(check);
  };

  return Array.from(wrapper.children).every(check);
}

/**
 * Find and return all block elements in the passed parent (including subtree)
 * @param parent - root element
 * @returns
 */
function getDeepestBlockElements(parent: Element): Element[] {
  if (containsOnlyInlineElements(parent)) {
    return [parent];
  }

  return Array.from(parent.children).reduce((result, element) => {
    return [...result, ...getDeepestBlockElements(element as HTMLElement)];
  }, []);
}

/**
 * Return element's offset related to the document
 * @todo handle case when editor initialized in scrollable popup
 * @param el - element to compute offset
 */
function offset(el): {
  /**
   * Calculated top offset of the passed element
   */
  top: number;

  /**
   * Calculated left offset of the passed element
   */
  left: number;

  /**
   * Calculated right offset of the passed element
   */
  right: number;

  /**
   * Calculated bottom offset of the passed element
   */
  bottom: number; } {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const rect = el.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const top = rect.top + scrollTop;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const left = rect.left + scrollLeft;

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  return {
    top,
    left,
    bottom: top + rect.height,
    right: left + rect.width,
  };
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
}

/**
 * Determine whether a passed text content is a collapsed whitespace.
 *
 * In HTML, whitespaces at the start and end of elements and outside elements are ignored.
 * There are two types of whitespaces in HTML:
 * - Visible (&nbsp;)
 * - Invisible (regular trailing spaces, tabs, etc)
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace
 * @see https://www.w3.org/TR/css-text-3/#white-space-processing
 * @param textContent — any string, for ex a textContent of a node
 * @returns True if passed text content is whitespace which is collapsed (invisible) in browser
 */
export function isCollapsedWhitespaces(textContent: string): boolean {
  /**
   *  Throughout, whitespace is defined as one of the characters
   *  "\t" TAB \u0009
   *  "\n" LF  \u000A
   *  "\r" CR  \u000D
   *  " "  SPC \u0020
   */
  return !/[^\t\n\r ]/.test(textContent);
}

/**
 * Calculates the Y coordinate of the text baseline from the top of the element's margin box,
 *
 * The calculation formula is as follows:
 *
 * 1. Calculate the baseline offset:
 * - Typically, the baseline is about 80% of the `fontSize` from the top of the text, as this is a common average for many fonts.
 *
 * 2. Calculate the additional space due to `lineHeight`:
 * - If the `lineHeight` is greater than the `fontSize`, the extra space is evenly distributed above and below the text. This extra space is `(lineHeight - fontSize) / 2`.
 *
 * 3. Calculate the total baseline Y coordinate:
 * - Sum of `marginTop`, `borderTopWidth`, `paddingTop`, the extra space due to `lineHeight`, and the baseline offset.
 * @param element - The element which baseline would be calculated
 * @returns - The Y coordinate of the text baseline from the top of the element's margin box.
 */
export function calculateBaseline(element: Element): number {
  const style = window.getComputedStyle(element);
  const fontSize = parseFloat(style.fontSize);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2; // default line-height if not set
  const paddingTop = parseFloat(style.paddingTop);
  const borderTopWidth = parseFloat(style.borderTopWidth);
  const marginTop = parseFloat(style.marginTop);

  /**
   * Typically, the baseline is about 80% of the `fontSize` from the top of the text, as this is a common average for many fonts.
   */
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const baselineOffset = fontSize * 0.8;

  /**
   * If the `lineHeight` is greater than the `fontSize`, the extra space is evenly distributed above and below the text. This extra space is `(lineHeight - fontSize) / 2`.
   */
  const extraLineHeight = (lineHeight - fontSize) / 2;

  /**
   * Calculate the total baseline Y coordinate from the top of the margin box
   */
  const baselineY = marginTop + borderTopWidth + paddingTop + extraLineHeight + baselineOffset;

  return baselineY;
}

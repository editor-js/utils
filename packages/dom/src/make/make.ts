/**
 * Helper for making Elements with class name and attributes
 * @param tagName - new Element tag name
 * @param classNames - list or name of CSS class name(s)
 * @param attributes - any attributes
 * @returns created HTMLElement
 */
export function make(tagName: string, classNames: string | (string | undefined)[] | null = null, attributes: object = {}): HTMLElement {
  const el = document.createElement(tagName);

  if (Array.isArray(classNames)) {
    const validClassnames = classNames.filter(className => className !== undefined);

    el.classList.add(...validClassnames);
  } else if (classNames !== null) {
    el.classList.add(classNames);
  }

  for (const attrName in attributes) {
    if (Boolean(Object.prototype.hasOwnProperty.call(attributes, attrName))) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      el[attrName] = attributes[attrName];
    }
  }

  return el;
}

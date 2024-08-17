/**
 * Return element's offset related to the document
 * @todo handle case when editor initialized in scrollable popup
 * @param el - element to compute offset
 */
export function offset(el: HTMLElement): {
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
  const rect = el.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  const top = rect.top + scrollTop;

  const left = rect.left + scrollLeft;

  return {
    top,
    left,
    bottom: top + rect.height,
    right: left + rect.width,
  };
}

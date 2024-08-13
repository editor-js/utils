/**
 * Return element's offset related to the document
 * @todo handle case when editor initialized in scrollable popup
 * @param el - element to compute offset
 */
export function offset(el): {
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

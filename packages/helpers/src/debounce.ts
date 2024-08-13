/**
 * Debouncing method
 * Call method after passed time
 *
 * Note that this method returns Function and declared variable need to be called
 * @param func - function that we're throttling
 * @param wait - time in milliseconds
 * @param immediate - call now
 * @returns
 */
export function debounce(func: (...args: unknown[]) => void, wait?: number, immediate?: boolean): () => void {
  let timeout;

  return (...args: unknown[]): void => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    const callNow = immediate && !timeout;

    window.clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
}

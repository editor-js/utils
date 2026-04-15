/**
 * Delays method execution
 * @param method - method to execute
 * @param timeout - timeout in ms
 */
export function delay(this: unknown, method: (...args: unknown[]) => unknown, timeout: number) {
  return function (this: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    const args = arguments;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    window.setTimeout(() => method.apply(context, args), timeout);
  };
}

/**
 * Returns random generated identifier
 * @param prefix - identifier prefix
 */
export function generateId(prefix = ''): string {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  return `${prefix}${(Math.floor(Math.random() * 1e8)).toString(16)}`;
}

import { make } from './make';

/**
 * Check if string contains html elements
 * @param str - string to check
 * @returns true if str is an html string, false otherwise
 */
export function isHTMLString(str: string): boolean {
  const wrapper = make('div');

  wrapper.innerHTML = str;

  return wrapper.childElementCount > 0;
}

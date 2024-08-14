import { make } from './make';

/**
 * Returns the HTML content of passed Document Fragment
 * @param fragment - document fragment to process
 * @returns the HTML content of passed Document Fragment
 */
export function fragmentToString(fragment: DocumentFragment): string {
  const div = make('div');

  div.appendChild(fragment);

  return div.innerHTML;
}

import { typeOf } from './typeOf';

/**
 * Checks if passed argument is undefined
 * @param v - variable to check
 * @returns true, if passed v is of type undefined, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isUndefined(v: any): v is undefined {
  return typeOf(v) === 'undefined';
}

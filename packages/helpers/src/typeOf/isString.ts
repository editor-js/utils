import { typeOf } from './typeOf';

/**
 * Checks if passed argument is a string
 * @param v - variable to check
 * @returns true, if passed v is ot type string, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isString(v: any): v is string {
  return typeOf(v) === 'string';
}

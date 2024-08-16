import { typeOf } from './typeOf';

/**
 * Check if passed variable is a function
 * @param fn - function to check
 * @returns true, if passed v is of type funciton, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction(fn: any): fn is (...args: any[]) => any {
  return typeOf(fn) === 'function' || typeOf(fn) === 'asyncfunction';
}

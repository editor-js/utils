import { notEmpty } from '.';

/**
 * True if passed variable is null/undefined/''/{}
 * @param v value to check
 */
export function isEmpty(v: unknown): v is null | undefined | '' | Record<string, never> {
  return !notEmpty(v);
}

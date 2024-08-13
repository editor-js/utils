import { isObject } from './typeOf';

/**
 * Merge two objects recursively
 * @param target - target to be merged
 * @param sources - sources to be merged
 * @returns sourced merged with sources
 */
export function deepMerge<T extends object>(target: T, ...sources: T[]): T {
  if (!sources.length) {
    return target;
  }
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (target[key] === null) {
          Object.assign(target, { [key]: {} });
        }
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

import { isObject } from './typeOf';

/**
 * Returns object with os name as key and boolean as value. Shows current user OS
 */
export function getUserOS(): { [key: string]: boolean } {
  const OS = {
    win: false,
    mac: false,
    x11: false,
    linux: false,
  };

  const userOS = Object.keys(OS).find((os: string) => window.navigator.appVersion.toLowerCase().indexOf(os) !== -1);

  if (userOS !== undefined) {
    OS[userOS] = true;

    return OS;
  }

  return OS;
}

/**
 * True if current device runs iOS
 */
export const isIosDevice
  = typeof window !== 'undefined'
  && window.navigator !== null
  && window.navigator.platform
  && (/iP(ad|hone|od)/.test(window.navigator.platform)
  || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1));

/**
 * Compares two values with unknown type
 * @param var1 - value to compare
 * @param var2 - value to compare with
 * @returns true if they are equal
 */
export function equals(var1: unknown, var2: unknown): boolean {
  const isVar1NonPrimitive = Array.isArray(var1) || isObject(var1);
  const isVar2NonPrimitive = Array.isArray(var2) || isObject(var2);

  if (isVar1NonPrimitive || isVar2NonPrimitive) {
    return JSON.stringify(var1) === JSON.stringify(var2);
  }

  return var1 === var2;
}

import { isObject } from './typeof';

/**
 * Returns basic key codes as constants
 * @returns {{}}
 */
export const keyCodes = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  SHIFT: 16,
  CTRL: 17,
  ALT: 18,
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  DOWN: 40,
  RIGHT: 39,
  DELETE: 46,
  META: 91,
  SLASH: 191,
};

/**
 * Return mouse buttons codes
 */
export const mouseButtons = {
  LEFT: 0,
  WHEEL: 1,
  RIGHT: 2,
  BACKWARD: 3,
  FORWARD: 4,
};

/**
 * Returns true if passed key code is printable (a-Z, 0-9, etc) character.
 * @param keyCode - code of some key
 * @returns true, if passed keyCode is printable, false otherwise
 */
export function isPrintableKey(keyCode: number): boolean {
  return (keyCode > 47 && keyCode < 58) // number keys
    || keyCode === 32 || keyCode === 13 // Space bar & return key(s)
    || keyCode === 229 // processing key input for certain languages — Chinese, Japanese, etc.
    || (keyCode > 64 && keyCode < 91) // letter keys
    || (keyCode > 95 && keyCode < 112) // Numpad keys
    || (keyCode > 185 && keyCode < 193) // ;=,-./` (in order)
    || (keyCode > 218 && keyCode < 223); // [\]' (in order)
}

/**
 * Copies passed text to the clipboard
 * @param text - text to copy
 */
export function copyTextToClipboard(text): void {
  const el = document.createElement('div');

  el.style.position = 'absolute';
  el.style.left = '-999px';
  el.style.bottom = '-999px';
  el.innerHTML = text;

  document.body.appendChild(el);

  const selection = window.getSelection();
  const range = document.createRange();

  range.selectNode(el);

  if (selection === null) {
    throw new Error('Cannot copy text to clipboard');
  }

  selection.removeAllRanges();
  selection.addRange(range);

  document.execCommand('copy');
  document.body.removeChild(el);
}

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

  if (userOS) {
    OS[userOS] = true;

    return OS;
  }

  return OS;
}

/**
 * Capitalizes first letter of the string
 * @param text - text to capitalize
 * @returns
 */
export function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

/**
 * Merge to objects recursively
 * @param target - merge target
 * @param sources - merge sources
 * @returns
 */
export function deepMerge<T extends object>(target, ...sources): T {
  if (!sources.length) {
    return target;
  }
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
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

/**
 * Return true if current device supports touch events
 *
 * Note! This is a simple solution, it can give false-positive results.
 * To detect touch devices more carefully, use 'touchstart' event listener
 * @see http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
 * @returns {boolean}
 */
export const isTouchSupported: boolean = 'ontouchstart' in document.documentElement;

/**
 * Make shortcut command more human-readable
 * @param shortcut — string like 'CMD+B'
 */
export function beautifyShortcut(shortcut: string): string {
  const OS = getUserOS();

  shortcut = shortcut
    .replace(/shift/gi, '⇧')
    .replace(/backspace/gi, '⌫')
    .replace(/enter/gi, '⏎')
    .replace(/up/gi, '↑')
    .replace(/left/gi, '→')
    .replace(/down/gi, '↓')
    .replace(/right/gi, '←')
    .replace(/escape/gi, '⎋')
    .replace(/insert/gi, 'Ins')
    .replace(/delete/gi, '␡')
    .replace(/\+/gi, ' + ');

  if (OS.mac) {
    shortcut = shortcut.replace(/ctrl|cmd/gi, '⌘').replace(/alt/gi, '⌥');
  } else {
    shortcut = shortcut.replace(/cmd/gi, 'Ctrl').replace(/windows/gi, 'WIN');
  }

  return shortcut;
}

/**
 * Returns valid URL. If it is going outside and valid, it returns itself
 * If url has `one slash`, then it concatenates with window location origin
 * or when url has `two lack` it appends only protocol
 * @param url - url to prettify
 */
export function getValidUrl(url: string): string {
  try {
    const urlObject = new URL(url);

    return urlObject.href;
  } catch (e) {
    // do nothing but handle below
  }

  if (url.substring(0, 2) === '//') {
    return window.location.protocol + url;
  } else {
    return window.location.origin + url;
  }
}

/**
 * Common method for printing a warning about the usage of deprecated property or method.
 * @param condition - condition for deprecation.
 * @param oldProperty - deprecated property.
 * @param newProperty - the property that should be used instead.
 */
export function deprecationAssert(condition: boolean, oldProperty: string, newProperty: string): void {
  const message = `«${oldProperty}» is deprecated and will be removed in the next major release. Please use the «${newProperty}» instead.`;

  if (condition) {
    console.warn(message);
  }
}

/**
 * Decorator which provides ability to cache method or accessor result
 * @param target - target instance or constructor function
 * @param propertyKey - method or accessor name
 * @param descriptor - property descriptor
 */
export function cacheable<Target, Value, Arguments extends unknown[] = unknown[]>(
  target: Target,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const propertyToOverride = descriptor.value ? 'value' : 'get';
  const originalMethod = descriptor[propertyToOverride];
  const cacheKey = `#${propertyKey}Cache`;

  /**
   * Override get or value descriptor property to cache return value
   * @param args - method args
   */
  descriptor[propertyToOverride] = function (...args: Arguments): Value {
    /**
     * If there is no cache, create it
     */
    if (this[cacheKey] === undefined) {
      this[cacheKey] = originalMethod.apply(this, ...args);
    }

    return this[cacheKey];
  };

  /**
   * If get accessor has been overridden, we need to override set accessor to clear cache
   * @param value - value to set
   */
  if (propertyToOverride === 'get' && descriptor.set) {
    const originalSet = descriptor.set;

    descriptor.set = function (value: unknown): void {
      delete target[cacheKey];

      originalSet.apply(this, value);
    };
  }

  return descriptor;
}

/**
 * True if current device runs iOS
 */
export const isIosDevice
  = typeof window !== 'undefined'
  && window.navigator
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

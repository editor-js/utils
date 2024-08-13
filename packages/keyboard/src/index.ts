declare global {
  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardLayoutMap
   */
  interface KeyboardLayoutMap {
    /**
     * Returns the element with the given key from the KeyboardLayoutMap object.
     * @param key - key which is used for getting keyboard layout map
     */
    get(key: string): string | undefined;

    /**
     * method of the KeyboardLayoutMap interface returns a boolean indicating
     * whether the object has an element with the specified key
     * @param key - key which is used for gettings element
     */
    has(key: string): boolean;

    /**
     * The size read-only property of the KeyboardLayoutMap interface returns the number of elements in the map
     */
    size: number;

    /**
     * Method of the KeyboardLayoutMap interface returns a new Iterator object
     * that contains the key/value pairs, in the same order as that provided by a for...in loop
     * (the difference being that a for-in loop enumerates properties in the prototype chain as well)
     */
    entries(): IterableIterator<[string, string]>;

    /**
     * method of the KeyboardLayoutMap interface returns a new Iterator object
     * that contains the keys for each index in the KeyboardLayoutMap object
     */
    keys(): IterableIterator<string>;

    /**
     * method of the KeyboardLayoutMap interface returns a new Iterator object
     * that contains the values for each index in the KeyboardLayoutMap object
     */
    values(): IterableIterator<string>;

    /**
     * Executes a provided function once for each element of KeyboardLayoutMap.
     * @param callbackfn
     * @param thisArg
     */
    forEach(callbackfn: (value: string, key: string, map: KeyboardLayoutMap) => void, thisArg?: unknown): void;
  }

  /**
   * The getLayoutMap() method of the Keyboard interface returns a Promise
   * that resolves with an instance of KeyboardLayoutMap which is a map-like object
   * with functions for retrieving the strings associated with specific physical keys.
   * https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/getLayoutMap
   */
  interface Keyboard {
    /**
     * Method that returns keyboard layout map with functoins
     */
    getLayoutMap(): Promise<KeyboardLayoutMap>;
  }
  /**
   * Navigator interface
   */
  interface Navigator {
    /**
     * Keyboard API. Not supported by Firefox and Safari.
     */
    keyboard?: Keyboard;
  }
}

/**
 * Returns real layout-related keyboard key for a given key code.
 * For example, for "Slash" it will return "/" on US keyboard and "-" on Spanish keyboard.
 *
 * Works with Keyboard API which is not supported by Firefox and Safari. So fallback is used for these browsers.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Keyboard
 * @param code - {@link https://www.w3.org/TR/uievents-code/#key-alphanumeric-writing-system}
 * @param fallback - fallback value to be returned if Keyboard API is not supported (Safari, Firefox)
 */
export async function getKeyboardKeyForCode(code: string, fallback: string): Promise<string> {
  const keyboard = navigator.keyboard;

  if (!keyboard) {
    return fallback;
  }

  const map = await keyboard.getLayoutMap();
  const key = map.get(code);

  return (key ?? '') || fallback;
}

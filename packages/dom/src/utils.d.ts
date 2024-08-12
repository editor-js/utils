/**
 * Class Util
 */
/**
 * Possible log levels
 */
export declare enum LogLevels {
    VERBOSE = "VERBOSE",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
/**
 * @typedef {object} ChainData
 * @property {object} data - data that will be passed to the success or fallback
 * @property {Function} function - function's that must be called asynchronously
 * @interface ChainData
 */
export interface ChainData {
    data?: object;
    function: (...args: any[]) => any;
}
/**
 * Editor.js utils
 */
/**
 * Returns basic key codes as constants
 *
 * @returns {{}}
 */
export declare const keyCodes: {
    BACKSPACE: number;
    TAB: number;
    ENTER: number;
    SHIFT: number;
    CTRL: number;
    ALT: number;
    ESC: number;
    SPACE: number;
    LEFT: number;
    UP: number;
    DOWN: number;
    RIGHT: number;
    DELETE: number;
    META: number;
    SLASH: number;
};
/**
 * Return mouse buttons codes
 */
export declare const mouseButtons: {
    LEFT: number;
    WHEEL: number;
    RIGHT: number;
    BACKWARD: number;
    FORWARD: number;
};
/**
 * Set current log level
 *
 * @param {LogLevels} logLevel - log level to set
 */
export declare function setLogLevel(logLevel: LogLevels): void;
/**
 * _log method proxy without Editor.js label
 */
export declare const log: any;
/**
 * _log method proxy with Editor.js label
 */
export declare const logLabeled: any;
/**
 * Return string representation of the object type
 *
 * @param {*} object - object to get type
 * @returns {string}
 */
export declare function typeOf(object: any): string;
/**
 * Check if passed variable is a function
 *
 * @param {*} fn - function to check
 * @returns {boolean}
 */
export declare function isFunction(fn: any): fn is (...args: any[]) => any;
/**
 * Checks if passed argument is an object
 *
 * @param {*} v - object to check
 * @returns {boolean}
 */
export declare function isObject(v: any): v is object;
/**
 * Checks if passed argument is a string
 *
 * @param {*} v - variable to check
 * @returns {boolean}
 */
export declare function isString(v: any): v is string;
/**
 * Checks if passed argument is boolean
 *
 * @param {*} v - variable to check
 * @returns {boolean}
 */
export declare function isBoolean(v: any): v is boolean;
/**
 * Checks if passed argument is number
 *
 * @param {*} v - variable to check
 * @returns {boolean}
 */
export declare function isNumber(v: any): v is number;
/**
 * Checks if passed argument is undefined
 *
 * @param {*} v - variable to check
 * @returns {boolean}
 */
export declare function isUndefined(v: any): v is undefined;
/**
 * Check if passed function is a class
 *
 * @param {Function} fn - function to check
 * @returns {boolean}
 */
export declare function isClass(fn: any): boolean;
/**
 * Checks if object is empty
 *
 * @param {object} object - object to check
 * @returns {boolean}
 */
export declare function isEmpty(object: object): boolean;
/**
 * Check if passed object is a Promise
 *
 * @param  {*}  object - object to check
 * @returns {boolean}
 */
export declare function isPromise(object: any): object is Promise<any>;
/**
 * Returns true if passed key code is printable (a-Z, 0-9, etc) character.
 *
 * @param {number} keyCode - key code
 * @returns {boolean}
 */
export declare function isPrintableKey(keyCode: number): boolean;
/**
 * Fires a promise sequence asynchronously
 *
 * @param {ChainData[]} chains - list or ChainData's
 * @param {Function} success - success callback
 * @param {Function} fallback - callback that fires in case of errors
 * @returns {Promise}
 * @deprecated use PromiseQueue.ts instead
 */
export declare function sequence(chains: ChainData[], success?: (data: object) => void, fallback?: (data: object) => void): Promise<void>;
/**
 * Make array from array-like collection
 *
 * @param {ArrayLike} collection - collection to convert to array
 * @returns {Array}
 */
export declare function array(collection: ArrayLike<any>): any[];
/**
 * Delays method execution
 *
 * @param {Function} method - method to execute
 * @param {number} timeout - timeout in ms
 */
export declare function delay(method: (...args: any[]) => any, timeout: number): () => void;
/**
 * Get file extension
 *
 * @param {File} file - file
 * @returns {string}
 */
export declare function getFileExtension(file: File): string;
/**
 * Check if string is MIME type
 *
 * @param {string} type - string to check
 * @returns {boolean}
 */
export declare function isValidMimeType(type: string): boolean;
/**
 * Debouncing method
 * Call method after passed time
 *
 * Note that this method returns Function and declared variable need to be called
 *
 * @param {Function} func - function that we're throttling
 * @param {number} wait - time in milliseconds
 * @param {boolean} immediate - call now
 * @returns {Function}
 */
export declare function debounce(func: (...args: unknown[]) => void, wait?: number, immediate?: boolean): () => void;
/**
 * Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
 *
 * @param func - function to throttle
 * @param wait - function will be called only once for that period
 * @param options - Normally, the throttled function will run as much as it can
 *                  without ever going more than once per `wait` duration;
 *                  but if you'd like to disable the execution on the leading edge, pass
 *                  `{leading: false}`. To disable execution on the trailing edge, ditto.
 */
export declare function throttle(func: any, wait: any, options?: {
    leading?: boolean;
    trailing?: boolean;
}): () => void;
/**
 * Copies passed text to the clipboard
 *
 * @param text - text to copy
 */
export declare function copyTextToClipboard(text: any): void;
/**
 * Returns object with os name as key and boolean as value. Shows current user OS
 */
export declare function getUserOS(): {
    [key: string]: boolean;
};
/**
 * Capitalizes first letter of the string
 *
 * @param {string} text - text to capitalize
 * @returns {string}
 */
export declare function capitalize(text: string): string;
/**
 * Merge to objects recursively
 *
 * @param {object} target - merge target
 * @param {object[]} sources - merge sources
 * @returns {object}
 */
export declare function deepMerge<T extends object>(target: any, ...sources: any[]): T;
/**
 * Return true if current device supports touch events
 *
 * Note! This is a simple solution, it can give false-positive results.
 * To detect touch devices more carefully, use 'touchstart' event listener
 *
 * @see http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
 * @returns {boolean}
 */
export declare const isTouchSupported: boolean;
/**
 * Make shortcut command more human-readable
 *
 * @param {string} shortcut — string like 'CMD+B'
 */
export declare function beautifyShortcut(shortcut: string): string;
/**
 * Returns valid URL. If it is going outside and valid, it returns itself
 * If url has `one slash`, then it concatenates with window location origin
 * or when url has `two lack` it appends only protocol
 *
 * @param {string} url - url to prettify
 */
export declare function getValidUrl(url: string): string;
/**
 * Create a block id
 *
 * @returns {string}
 */
export declare function generateBlockId(): string;
/**
 * Opens new Tab with passed URL
 *
 * @param {string} url - URL address to redirect
 */
export declare function openTab(url: string): void;
/**
 * Returns random generated identifier
 *
 * @param {string} prefix - identifier prefix
 * @returns {string}
 */
export declare function generateId(prefix?: string): string;
/**
 * Common method for printing a warning about the usage of deprecated property or method.
 *
 * @param condition - condition for deprecation.
 * @param oldProperty - deprecated property.
 * @param newProperty - the property that should be used instead.
 */
export declare function deprecationAssert(condition: boolean, oldProperty: string, newProperty: string): void;
/**
 * Decorator which provides ability to cache method or accessor result
 *
 * @param target - target instance or constructor function
 * @param propertyKey - method or accessor name
 * @param descriptor - property descriptor
 */
export declare function cacheable<Target, Value, Arguments extends unknown[] = unknown[]>(target: Target, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
/**
 * All screens below this width will be treated as mobile;
 */
export declare const mobileScreenBreakpoint = 650;
/**
 * True if screen has mobile size
 */
export declare function isMobileScreen(): boolean;
/**
 * True if current device runs iOS
 */
export declare const isIosDevice: boolean;
/**
 * Compares two values with unknown type
 *
 * @param var1 - value to compare
 * @param var2 - value to compare with
 * @returns {boolean} true if they are equal
 */
export declare function equals(var1: unknown, var2: unknown): boolean;

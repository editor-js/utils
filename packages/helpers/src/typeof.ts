
/**
 * Return string representation of the object type
 * @param object - object to get type
 * @returns string type name of the passed object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function typeOf(object: any): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,  @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return Object.prototype.toString.call(object).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

/**
 * Check if passed variable is a function
 * @param fn - function to check
 * @returns true, if passed v is of type funciton, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction(fn: any): fn is (...args: any[]) => any {
  return typeOf(fn) === 'function' || typeOf(fn) === 'asyncfunction';
}

/**
 * Checks if passed argument is an object
 * @param v - object to check
 * @returns true, if passed v is of type object, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isObject(v: any): v is object {
  return typeOf(v) === 'object';
}

/**
 * Checks if passed argument is a string
 * @param v - variable to check
 * @returns true, if passed v is ot type string, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isString(v: any): v is string {
  return typeOf(v) === 'string';
}

/**
 * Checks if passed argument is boolean
 * @param v - variable to check
 * @returns true, if passed v is of type boolean, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isBoolean(v: any): v is boolean {
  return typeOf(v) === 'boolean';
}

/**
 * Checks if passed argument is number
 * @param v - variable to check
 * @returns true, if passed v is of type number, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNumber(v: any): v is number {
  return typeOf(v) === 'number';
}

/**
 * Checks if passed argument is undefined
 * @param v - variable to check
 * @returns true, if passed v is of type undefined, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isUndefined(v: any): v is undefined {
  return typeOf(v) === 'undefined';
}

/**
 * Check if passed function is a class
 * @param fn - function to check
 * @returns true, if passed fn is a class, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isClass(fn: any): boolean {
  return isFunction(fn) && /^\s*class\s+/.test(fn.toString());
}

/**
 * True if passed variable is not null/undefined/''/{}
 * @param v value to check
 */
export function notEmpty<T>(v: T | undefined | null | object): v is T {
  return v !== undefined && v !== null && v !== '' && (typeof v !== 'object' || Object.keys(v).length > 0);
}

/**
 * True if passed variable is null/undefined/''/{}
 * @param v value to check
 */
export function isEmpty(v: unknown): v is null | undefined | '' | Record<string, never> {
  return !notEmpty(v);
}

/**
 * Check if passed object is a Promise
 * @param  object - object to check
 * @returns true, if passed object is a promise, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPromise(object: any): object is Promise<any> {
  return Promise.resolve(object) === object;
}

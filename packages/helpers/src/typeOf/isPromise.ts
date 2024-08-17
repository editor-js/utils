/**
 * Check if passed object is a Promise
 * @param  object - object to check
 * @returns true, if passed object is a promise, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPromise(object: any): object is Promise<any> {
  return Promise.resolve(object) === object;
}

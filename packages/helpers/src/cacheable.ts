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

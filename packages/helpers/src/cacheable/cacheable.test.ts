import { test, describe, expect, vi } from 'vitest';
import { cacheable } from './cacheable';

/**
 * Class for cachable decorator testing
 */
class testClass {
  /**
   * Test method with cachable decorator
   * @param a - test constant paramenter
   */
  @cacheable
  public double(a: number): number {
    /**
     * This is workaround for spy on double function
     * vitest's toBeCalledTimes counts call even if we call just a decorator
     * so it should count visiting of the function only when we pass cachable decorator
     */
    this.doubleCalled();

    return a * 2;
  }

  /**
   * Test method with cachable decorator and several arguments
   * @param a - test constant parameter
   * @param b - test constant parameter
   */
  @cacheable
  public addadd(a: number, b: number): number {
    /**
     * This is workaround for spy on double function
     * vitest's toBeCalledTimes counts call even if we call just a decorator
     * so it should count visiting of the function only when we pass cachable decorator
     */
    this.addCalled();

    return a + b;
  }

  /**
   * Test getter method with cachable decorator
   */
  @cacheable
  public get getter(): number {
    /**
     * This is workaround for spy on double function
     * vitest's toBeCalledTimes counts call even if we call just a decorator
     * so it should count visiting of the function only when we pass cachable decorator
     */
    this.getterCalled();

    return 0;
  }

  /**
   * Anchore function to spy on double method visiting
   */
  public doubleCalled(): void {};

  /**
   * Anchore function to spy on add method visiting
   */
  public addCalled(): void {};

  /**
   * Anchore function to spy on add method visiting
   */
  public getterCalled(): void {};
}

describe('Test cacheable decorator', () => {
  test('Should call cacheable function with same arguments only one time', () => {
    const classInstance = new testClass();

    /** Spy on the method to count how many times it's called */
    const oneArgMethodSpy = vi.spyOn(classInstance, 'doubleCalled');
    const severalArgMethodSpy = vi.spyOn(classInstance, 'addCalled');
    const getterMethodSpy = vi.spyOn(classInstance, 'getterCalled');

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    for (let i = 0; i < 5; i++) {
      classInstance.double(1);
      classInstance.addadd(1, 1);
      classInstance.getter;
    }

    /**
     * We expect, that we get inside of the double function only one time,
     * Other times we call cachable decorator and it returns value without visiting actual double function
     */
    expect(severalArgMethodSpy).toBeCalledTimes(1);
    expect(getterMethodSpy).toBeCalledTimes(1);
    expect(oneArgMethodSpy).toBeCalledTimes(1);

    vi.restoreAllMocks();
  });
});

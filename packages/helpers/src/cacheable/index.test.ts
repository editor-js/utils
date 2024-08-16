import { test, describe, expect, vi } from 'vitest';
import { cacheable } from '.';

/**
 * Class for cachable decorator testing
 */
class testClass {
  /**
   * Test function with cachable decorator
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
   * Anchore function to spy on
   */
  public doubleCalled(): void {};
}

describe('Test cacheable decorator', () => {
  test('Should call cacheable function with same arguments only one time', () => {
    const classInstance = new testClass();

    /** Spy on the method to count how many times it's called */
    const spy = vi.spyOn(classInstance, 'doubleCalled');

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      classInstance.double(5);
    }

    /**
     * We expect, that we get inside of the double function only one time,
     * Other times we call cachable decorator and it returns value without visiting actual double function
     */
    expect(spy).toBeCalledTimes(1);

    spy.mockRestore();
  });
});

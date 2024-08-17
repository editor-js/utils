import { describe, test, expect } from 'vitest';
import { isFunction } from './isFunction';

describe('Test isFunction function', () => {
  test.each(
    [
      {
        target: function myFunction() {},
        expectedResponse: true,
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        target: async function myAsyncFunction() {},
        expectedResponse: true,
      },
      {
        target: () => {},
        expectedResponse: true,
      },
      {
        target: class MyClass {},
        expectedResponse: true,
      },
      {
        target: {},
        expectedResponse: false,
      },
      {
        target: [],
        expectedResponse: false,
      },
      {
        target: 42,
        expectedResponse: false,
      },
      {
        target: 'string',
        expectedResponse: false,
      },
      {
        target: null,
        expectedResponse: false,
      },
      {
        target: undefined,
        expectedResponse: false,
      },
      {
        target: new Date(),
        expectedResponse: false,
      },
    ]
  )(
    'should return $expectedResponse for $target',
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ({ target, expectedResponse }) => {
      expect(isFunction(target)).toBe(expectedResponse);
    }
  );
});

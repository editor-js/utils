import { describe, test, expect } from 'vitest';
import { isClass } from './isClass';

describe('Test isClass function', () => {
  test.each(
    [
      {
        target: class MyClass {},
        expectedResponse: true,
      },
      {
        target: class {},
        expectedResponse: true,
      },
      {
        target: function myFunction() {},
        expectedResponse: false,
      },
      {
        target: function () {},
        expectedResponse: false,
      },
      {
        target: () => {},
        expectedResponse: false,
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
        target: () => {
          return this;
        },
        expectedResponse: false,
      },
    ]
  )(
    'should return $expectedResponse for $target',
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ({ target, expectedResponse }) => {
      expect(isClass(target)).toBe(expectedResponse);
    }
  );
});

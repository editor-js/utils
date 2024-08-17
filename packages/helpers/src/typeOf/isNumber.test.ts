import { describe, test, expect } from 'vitest';
import { isNumber } from './isNumber';

describe('Test isNumber function', () => {
  test.each(
    [
      {
        target: 42,
        expectedResponse: true,
      },
      {
        target: 0,
        expectedResponse: true,
      },
      {
        target: 3.14,
        expectedResponse: true,
      },
      {
        target: 'string',
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
        target: null,
        expectedResponse: false,
      },
      {
        target: undefined,
        expectedResponse: false,
      },
      {
        target: true,
        expectedResponse: false,
      },
      {
        target: () => {},
        expectedResponse: false,
      },
      {
        target: Symbol('symbol'),
        expectedResponse: false,
      },
    ]
  )(
    'should return $expectedResponse for $target',
    ({ target, expectedResponse }) => {
      expect(isNumber(target)).toBe(expectedResponse);
    }
  );
});

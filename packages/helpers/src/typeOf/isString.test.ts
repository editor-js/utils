import { describe, test, expect } from 'vitest';
import { isString } from './isString';

describe('Test isString function', () => {
  test.each(
    [
      {
        target: 42,
        expectedResponse: false,
      },
      {
        target: 3.14,
        expectedResponse: false,
      },
      {
        target: 'string',
        expectedResponse: true,
      },
      {
        target: '',
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
    'should return $expectedResponse for $target', ({ target, expectedResponse }) => {
      expect(isString(target)).toBe(expectedResponse);
    }
  );
});

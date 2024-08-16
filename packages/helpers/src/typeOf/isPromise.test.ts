import { describe, test, expect } from 'vitest';
import { isPromise } from './isPromise';

describe('Test isPromise function', () => {
  test.each(
    [
      {
        target: Promise.resolve(),
        expectedResponse: true,
      },
      {
        target: new Promise(() => {}),
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
        target: () => {},
        expectedResponse: false,
      },
    ]
  )(
    'should return $expectedResponse for $target',
    ({ target, expectedResponse }) => {
      expect(isPromise(target)).toBe(expectedResponse);
    }
  );
});

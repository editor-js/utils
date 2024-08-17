import { describe, test, expect } from 'vitest';
import { isUndefined } from './isUndefined';

describe('Test isUndefined function', () => {
  test.each(
    [
      {
        target: Promise.resolve(),
        expectedResponse: false,
      },
      {
        target: new Promise(() => {}),
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
        expectedResponse: true,
      },
      {
        target: () => {},
        expectedResponse: false,
      },
    ]
  )(
    'should return $expectedResponse for $target',
    ({ target, expectedResponse }) => {
      expect(isUndefined(target)).toBe(expectedResponse);
    }
  );
});

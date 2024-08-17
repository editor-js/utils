import { describe, test, expect } from 'vitest';
import { isBoolean } from './isBoolean';

describe('Test isBoolean function', () => {
  test.each(
    [
      {
        target: true,
        expectedResponse: true,
      },
      {
        target: false,
        expectedResponse: true,
      },
      {
        target: {},
        expectedResponse: false,
      },
      {
        target: new Promise(() => {}),
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
      expect(isBoolean(target)).toBe(expectedResponse);
    }
  );
});

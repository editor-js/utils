import { describe, test, expect } from 'vitest';
import { isObject } from './isObject';

describe('Test isObject function', () => {
  test.each(
    [
      {
        target: {},
        expectedResponse: true,
      },
      {
        target: {
          key1: 'value1',
          key2: 2,
        },
        expectedResponse: true,
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
      expect(isObject(target)).toBe(expectedResponse);
    }
  );
});

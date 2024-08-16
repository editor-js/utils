import { describe, test, expect } from 'vitest';
import { typeOf } from './typeOf';

describe('Test typeOf function', () => {
  test.each(
    [
      {
        target: Promise.resolve(),
        expectedResponse: 'promise',
      },
      {
        target: new Promise(() => {}),
        expectedResponse: 'promise',
      },
      {
        target: {},
        expectedResponse: 'object',
      },
      {
        target: true,
        expectedResponse: 'boolean',
      },
      {
        target: class myClass {},
        expectedResponse: 'function',
      },
      {
        target: [],
        expectedResponse: 'array',
      },
      {
        target: 42,
        expectedResponse: 'number',
      },
      {
        target: 'string',
        expectedResponse: 'string',
      },
      {
        target: null,
        expectedResponse: 'null',
      },
      {
        target: undefined,
        expectedResponse: 'undefined',
      },
      {
        target: () => {},
        expectedResponse: 'function',
      },
    ]
  )(
    'should return $expectedResponse for $target',
    ({ target, expectedResponse }) => {
      expect(typeOf(target)).toBe(expectedResponse);
    }
  );
});

import { describe, test, expect } from 'vitest';
import { equals } from '.';

describe('equals', () => {
  test.each(
    [
      {
        var1: 1,
        var2: 1,
        expected: true,
      },
      {
        var1: 1,
        var2: 2,
        expected: false,
      },
      {
        var1: 'string',
        var2: 'string',
        expected: true,
      },
      {
        var1: 'string',
        var2: 'different',
        expected: false,
      },
      {
        var1: true,
        var2: true,
        expected: true,
      },
      {
        var1: true,
        var2: false,
        expected: false,
      },
      {
        var1: null,
        var2: null,
        expected: true,
      },
      {
        var1: null,
        var2: undefined,
        expected: false,
      },
      {
        var1: undefined,
        var2: undefined,
        expected: true,
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        var1: [1, 2, 3],
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        var2: [1, 2, 3],
        expected: true,
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        var1: [1, 2, 3],
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        var2: [1, 2, 4],
        expected: false,
      },
      {
        var1: [],
        var2: [],
        expected: true,
      },
      {
        var1: [],
        var2: [1],
        expected: false,
      },
      {
        var1: { a: 1,
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          b: [1, 2, 3] },
        var2: { a: 1,
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          b: [1, 2, 3] },
        expected: true,
      },
      {
        var1: { a: 1,
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          b: [1, 2, 3] },
        var2: { a: 1,
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          b: [1, 2, 4] },
        expected: false,
      },
      {
        var1: { a: { b: { c: 1 } } },
        var2: { a: { b: { c: 1 } } },
        expected: true,
      },
      {
        var1: { a: { b: { c: 1 } } },
        var2: { a: { b: { c: 2 } } },
        expected: false,
      },
      {
        var1: 1,
        var2: '1',
        expected: false,
      },
      {
        var1: [1],
        var2: 1,
        expected: false,
      },
      {
        var1: { a: 1 },
        var2: 1,
        expected: false,
      },
      {
        var1: null,
        var2: undefined,
        expected: false,
      },
      {
        var1: undefined,
        var2: null,
        expected: false,
      },
    ]
  )(
    'should return $expected when comparing $var1 and $var2',
    ({ var1, var2, expected }) => {
      expect(equals(var1, var2)).toBe(expected);
    }
  );
});

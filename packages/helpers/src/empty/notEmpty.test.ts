import { describe, test, expect } from 'vitest';
import { notEmpty } from '.';

describe('Test notEmpty function', () => {
  test.each([
    {
      value: undefined,
      expectedResponse: false,
    },
    {
      value: null,
      expectedResponse: false,
    },
    {
      value: '',
      expectedResponse: false,
    },
    {
      value: {} as object,
      expectedResponse: false,
    },
    {
      value: [],
      expectedResponse: false,
    },
    {
      value: 'non-empty string',
      expectedResponse: true,
    },
    {
      value: 42,
      expectedResponse: true,
    },
    {
      value: true,
      expectedResponse: true,
    },
    {
      value: { key: 'value' },
      expectedResponse: true,
    },
    {
      value: [1, 2],
      expectedResponse: true,
    },
  ])(
    'should return $expectedResponse for value $value',
    ({ value, expectedResponse }) => {
      /**
       * Call not empty
       */
      const result = notEmpty(value);

      /**
       * Check that result is correct
       */
      expect(result).toBe(expectedResponse);
    }
  );
});

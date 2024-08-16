import { describe, test, expect } from 'vitest';
import { isEmpty } from '.';

describe('Test notEmpty function', () => {
  test.each([
    {
      value: undefined,
      expectedResponse: true,
    },
    {
      value: null,
      expectedResponse: true,
    },
    {
      value: '',
      expectedResponse: true,
    },
    {
      value: {} as object,
      expectedResponse: true,
    },
    {
      value: [],
      expectedResponse: true,
    },
    {
      value: 'non-empty string',
      expectedResponse: false,
    },
    {
      value: 42,
      expectedResponse: false,
    },
    {
      value: true,
      expectedResponse: false,
    },
    {
      value: { key: 'value' },
      expectedResponse: false,
    },
    {
      value: [1, 2],
      expectedResponse: false,
    },
  ])(
    'should return $expectedResponse for value $value',
    ({ value, expectedResponse }) => {
      /**
       * Call not empty
       */
      const result = isEmpty(value);

      /**
       * Check that result is correct
       */
      expect(result).toBe(expectedResponse);
    }
  );
});

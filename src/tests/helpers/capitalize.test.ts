import { test, describe, expect } from 'vitest';
import { capitalize } from '@editorjs/helpers';

describe('Test capitalize function', () => {
  test.each(
    [
      {
        stringToCapitalize: 'aaaa',
        capitalized: 'Aaaa',
      },
      {
        stringToCapitalize: 'AAAA',
        capitalized: 'AAAA',
      },
      {
        stringToCapitalize: '1234',
        capitalized: '1234',
      },
      {
        stringToCapitalize: '1234a',
        capitalized: '1234a',
      },
    ])('Should return capitalized string', ({ stringToCapitalize, capitalized }) => {
    expect(capitalize(stringToCapitalize)).toBe(capitalized);
  });
});

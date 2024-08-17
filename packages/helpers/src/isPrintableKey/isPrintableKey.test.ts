import { describe, test, expect } from 'vitest';
import { isPrintableKey } from '.';

describe('isPrintableKey function', () => {
  test.each([
    /**
     * Printable keys
     */
    {
      keyCode: 65,
      expected: true,
    }, // 'A'
    {
      keyCode: 90,
      expected: true,
    }, // 'Z'
    {
      keyCode: 48,
      expected: true,
    }, // '0'
    {
      keyCode: 57,
      expected: true,
    }, // '9'
    {
      keyCode: 32,
      expected: true,
    }, // Space bar
    {
      keyCode: 13,
      expected: true,
    }, // Enter
    {
      keyCode: 229,
      expected: true,
    }, // Input method editor (IME) key
    {
      keyCode: 186,
      expected: true,
    }, // ';'
    {
      keyCode: 222,
      expected: true,
    }, // '''
    {
      keyCode: 96,
      expected: true,
    }, // Numpad 0
    {
      keyCode: 111,
      expected: true,
    }, // Numpad /

    /**
     * Non-printable keys
     */
    {
      keyCode: 9,
      expected: false,
    }, // Tab
    {
      keyCode: 27,
      expected: false,
    }, // Escape
    {
      keyCode: 112,
      expected: false,
    }, // F1
    {
      keyCode: 145,
      expected: false,
    }, // Scroll Lock
    {
      keyCode: 20,
      expected: false,
    }, // Caps Lock
    {
      keyCode: 37,
      expected: false,
    }, // Arrow Left
    {
      keyCode: 40,
      expected: false,

    }, // Arrow Down
    {
      keyCode: 112,
      expected: false,

    }, // F1
  ])(
    'should return $expected for keyCode $keyCode',
    ({ keyCode, expected }) => {
      // Вызов функции с тестовым значением
      const result = isPrintableKey(keyCode);

      // Проверка, что результат соответствует ожидаемому
      expect(result).toBe(expected);
    }
  );
});

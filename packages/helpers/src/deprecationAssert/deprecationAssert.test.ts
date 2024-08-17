import { describe, test, expect, vi } from 'vitest';
import { deprecationAssert } from './deprecationAssert';

describe('Test deprecationAssert function', () => {
  test.each([
    {
      condition: true,
      oldProperty: 'oldMethod',
      newProperty: 'newMethod',
      expectedCalled: true,
    },
    {
      condition: false,
      oldProperty: 'oldMethod',
      newProperty: 'newMethod',
      expectedCalled: false,
    },
  ])(
    'should %s a warning message for old property "%s" and new property "%s"',
    ({ condition, oldProperty, newProperty, expectedCalled }) => {
      /**
       * Spy on console warning method (which is called inside deprecationAssert function)
       */
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      /**
       * Form expected message
       */
      const expectedMessage = `«${oldProperty}» is deprecated and will be removed in the next major release. Please use the «${newProperty}» instead.`;

      deprecationAssert(condition, oldProperty, newProperty);

      if (expectedCalled) {
        /**
         * Check, that console warning had been called with correct message
         */
        expect(consoleWarnSpy).toHaveBeenCalledWith(expectedMessage);
      } else {
        /**
         * Check, that console warnind had not been called
         */
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      }

      consoleWarnSpy.mockRestore();
    }
  );
});

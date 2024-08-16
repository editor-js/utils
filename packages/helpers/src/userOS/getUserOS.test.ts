import { describe, test, vi, expect } from 'vitest';
import { getUserOS } from './getUserOS';

describe('Test getUserOs function', () => {
  test.each([
    {
      OSName: 'Windows NT',
      expectedResponse: {
        win: true,
        mac: false,
        x11: false,
        linux: false,
      },
    },
    {
      OSName: 'Mac OS X',
      expectedResponse: {
        win: false,
        mac: true,
        x11: false,
        linux: false,
      },
    },
    {
      OSName: 'Random OS',
      expectedResponse: {
        win: false,
        mac: false,
        x11: false,
        linux: false,
      },
    },
  ])('Should return object with marked actual OS', ({ OSName, expectedResponse }) => {
    vi.stubGlobal('window', {
      navigator: {
        appVersion: OSName,
      },
    });

    const os = getUserOS();

    expect(os).toStrictEqual(expectedResponse);
  });
});

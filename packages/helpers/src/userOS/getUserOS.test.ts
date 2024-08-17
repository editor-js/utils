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
      OSName: 'X11; Linux x86_64',
      expectedResponse: {
        win: false,
        mac: false,
        x11: true,
        linux: false,
      },
    },
    {
      OSName: 'Linux',
      expectedResponse: {
        win: false,
        mac: false,
        x11: false,
        linux: true,
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

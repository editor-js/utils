import { describe, test, expect, vi } from 'vitest';
import { isIosDevice } from './isIosDevice';

describe('isIosDevice', () => {
  const mockNavigator = (platform: string, maxTouchPoints: number): void => {
    vi.stubGlobal('window', {
      navigator: {
        platform,
        maxTouchPoints,
      },
    });
  };

  test.each(
    [
      {
        platform: 'iPhone',
        maxTouchPoints: 0,
        expected: true,
      },
      {
        platform: 'iPad',
        maxTouchPoints: 0,
        expected: true,
      },
      {
        platform: 'iPod',
        maxTouchPoints: 0,
        expected: true,
      },
      {
        platform: 'MacIntel',
        maxTouchPoints: 2,
        expected: true,
      },
      {
        platform: 'MacIntel',
        maxTouchPoints: 1,
        expected: false,
      },
      {
        platform: 'Win32',
        maxTouchPoints: 0,
        expected: false,
      },
      {
        platform: 'Linux x86_64',
        maxTouchPoints: 0,
        expected: false,
      },
      {
        platform: '',
        maxTouchPoints: 0,
        expected: false,
      },
    ]
  )(
    'should return $expected for platform $platform with $maxTouchPoints maxTouchPoints',
    ({ platform, maxTouchPoints, expected }) => {
      mockNavigator(platform, maxTouchPoints);
      expect(isIosDevice()).toBe(expected);
    }
  );
});

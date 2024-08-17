import { test, describe, expect, vi, afterEach } from 'vitest';
import { beautifyShortcut } from './beautifyShortcut';

describe('Test beautifyShortcut function', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  test.each([
    {
      shortcut: 'shift',
      beautified: '⇧',
    },
    {
      shortcut: 'backspace',
      beautified: '⌫',
    },
    {
      shortcut: 'enter',
      beautified: '⏎',
    },
    {
      shortcut: 'up',
      beautified: '↑',
    },
    {
      shortcut: 'left',
      beautified: '→',
    },
    {
      shortcut: 'down',
      beautified: '↓',
    },
    {
      shortcut: 'right',
      beautified: '←',
    },
    {
      shortcut: 'escape',
      beautified: '⎋',
    },
    {
      shortcut: 'insert',
      beautified: 'Ins',
    },
    {
      shortcut: 'delete',
      beautified: '␡',
    },
    {
      shortcut: '+',
      beautified: '+',
    },
    {
      shortcut: 'up + shift',
      beautified: '↑ + ⇧',
    },
    {
      shortcut: 'up + shift + delete',
      beautified: '↑ + ⇧ + ␡',
    },
  ])('should beautify "$shortcut" to "$beautified"', ({ shortcut, beautified }) => {
    /**
     * Shortcuts in this tests are not dependant on OS, but window should be defined
     */
    vi.stubGlobal('window', {
      navigator: {
        appVersion: 'Windows NT',
      },
    });

    expect(beautifyShortcut(shortcut)).toBe(beautified);
  });

  // Tests for OS-specific behavior
  describe('OS-specific tests', () => {
    test('should replace cmd with Cmd on macOS', () => {
      vi.stubGlobal('window', {
        navigator: {
          appVersion: 'Mac OS X',
        },
      });

      expect(beautifyShortcut('cmd + c')).toBe('⌘ + c');
    });

    test('should replace cmd with Ctrl on Windows', () => {
      vi.stubGlobal('window', {
        navigator: {
          appVersion: 'Windows NT',
        },
      });

      expect(beautifyShortcut('cmd + c')).toBe('Ctrl + c');
    });

    test('should replace cmd with Ctrl on Linux', () => {
      vi.stubGlobal('window', {
        navigator: {
          appVersion: 'Linux',
        },
      });

      expect(beautifyShortcut('cmd + c')).toBe('Ctrl + c');
    });
  });
});

import { afterEach, describe, expect, test, vi } from 'vitest';

/**
 * Stand-in for codex-tooltip: records construction, since constructing it is what registers
 * its window-level scroll listener
 */
const { Tooltip } = vi.hoisted(() => ({
  Tooltip: vi.fn(function (this: Record<string, unknown>) {
    this.show = vi.fn();
    this.hide = vi.fn();
    this.onHover = vi.fn();
    this.destroy = vi.fn();
  }),
}));

vi.mock('codex-tooltip', () => ({ default: Tooltip }));

/**
 * The parts of a stand-in instance the tests inspect
 */
interface TooltipInstance {
  /**
   * Recorded hide() calls
   */
  hide: ReturnType<typeof vi.fn>;
}

const tooltip = await import('./tooltip');

describe('tooltip', () => {
  afterEach(() => {
    tooltip.destroy();
    Tooltip.mockClear();
  });

  test('hide() does not create the tooltip when none has been shown', () => {
    tooltip.hide();
    tooltip.hide(true);

    expect(Tooltip).not.toHaveBeenCalled();
  });

  test('hide() hides an existing tooltip', () => {
    const element = {} as HTMLElement;

    tooltip.show(element, 'Hint');
    tooltip.hide(true);

    const instance = Tooltip.mock.instances[0] as unknown as TooltipInstance;

    expect(Tooltip).toHaveBeenCalledTimes(1);
    expect(instance.hide).toHaveBeenCalledWith(true);
  });

  test('show() creates the tooltip on first use', () => {
    tooltip.show(({} as HTMLElement), 'Hint');

    expect(Tooltip).toHaveBeenCalledTimes(1);
  });

  test('hide() after destroy() does not create a new tooltip', () => {
    tooltip.show(({} as HTMLElement), 'Hint');
    tooltip.destroy();
    Tooltip.mockClear();

    tooltip.hide();

    expect(Tooltip).not.toHaveBeenCalled();
  });
});

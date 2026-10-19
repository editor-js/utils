/**
 * Use external module CodeX Tooltip
 */
import CodeXTooltips from 'codex-tooltip';
import type { TooltipOptions, TooltipContent } from 'codex-tooltip/types';

/**
 * Tooltips lib: CodeX Tooltips
 * @see https://github.com/codex-team/codex.tooltips
 */
let lib: null | CodeXTooltips = null;

/**
 * If library is needed, but it is not initialized yet, this function will initialize it
 *
 * For example, if editor was destroyed and then initialized again
 */
function prepare(): void {
  if (lib) {
    return;
  }

  lib = new CodeXTooltips();
}

/**
 * Shows tooltip on element with passed HTML content
 * @param element - any HTML element in DOM
 * @param content - tooltip's content
 * @param options - showing settings
 */
export function show(element: HTMLElement, content: TooltipContent, options?: TooltipOptions): void {
  prepare();

  lib?.show(element, content, options);
}

/**
 * Hides tooltip
 *
 * Does nothing when no tooltip has been created: there is nothing to hide, and creating one here
 * would register its window-level listeners on teardown paths (e.g. destroying a popover item)
 * where nothing was ever shown
 * @param skipHidingDelay — pass true to immediately hide the tooltip
 */
export function hide(skipHidingDelay = false): void {
  lib?.hide(skipHidingDelay);
}

/**
 * Binds 'mouseenter' and 'mouseleave' events that shows/hides the Tooltip
 * @param element - any HTML element in DOM
 * @param content - tooltip's content
 * @param options - showing settings
 */
export function onHover(element: HTMLElement, content: TooltipContent, options?: TooltipOptions): void {
  prepare();

  lib?.onHover(element, content, options);
}

/**
 * Release the library
 */
export function destroy(): void {
  lib?.destroy();
  lib = null;
}

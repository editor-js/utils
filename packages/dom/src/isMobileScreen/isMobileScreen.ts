/**
 * All screens below this width will be treated as mobile;
 */
export const mobileScreenBreakpoint = 650;

/**
 * True if screen has mobile size
 */
export function isMobileScreen(): boolean {
  return window.matchMedia(`(max-width: ${mobileScreenBreakpoint}px)`).matches;
}

import { bem } from '@editorjs/helpers';

/**
 * Popover item block CSS class constructor
 */
const className = bem('ce-popover-item-html');

/**
 * CSS class names to be used in popover item class
 */
export const css = {
  root: className(),
  hidden: className(null, 'hidden'),
};

/**
 * Native controls that can take the focus, and so the keyboard navigation, inside custom html.
 *
 * Shared by the navigation of the list (the Flipper walks these) and by the mobile dialog's
 * focus trap, so that both of them agree on what counts as a stop
 */
export const FOCUSABLE_CONTROLS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

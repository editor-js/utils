import { bem } from '@editorjs/helpers';

/**
 * Popover search input block CSS class constructor
 */
const className = bem('cdx-search-field');

/**
 * CSS class names to be used in popover search input class
 */
export const css = {
  wrapper: className(),
  icon: className('icon'),
  input: className('input'),
};

import { isString } from '@editorjs/helpers';
import { blockElements } from '../blockElements';

/**
 * Check if passed content includes only inline elements
 * @param data - element or html string
 * @returns true if data contains only inline elements, false otherwise
 */
export function containsOnlyInlineElements(data: string | HTMLElement): boolean {
  let wrapper: HTMLElement;

  if (isString(data)) {
    wrapper = document.createElement('div');
    wrapper.innerHTML = data;
  } else {
    wrapper = data;
  }

  const check = (element: HTMLElement): boolean => {
    return !blockElements().includes(element.tagName.toLowerCase())
      && Array.from(element.children).every(check);
  };

  return Array.from(wrapper.children).every(check);
}

import { containsOnlyInlineElements } from './containsOnlyInlineElements';
import { getDeepestBlockElements } from './getDeepestBlockElements';

/**
 * Returns CSS selector for all text inputs
 */
export function allInputsSelector(): string {
  const allowedInputTypes = ['text', 'password', 'email', 'number', 'search', 'tel', 'url'];

  return '[contenteditable=true], textarea, input:not([type]), '
    + allowedInputTypes.map(type => `input[type="${type}"]`).join(', ');
}

/**
 * Checks target if it is native input
 * @param target - HTML element or string
 * @returns true if target is an input element, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNativeInput(target: any): target is HTMLInputElement | HTMLTextAreaElement {
  const nativeInputs = [
    'INPUT',
    'TEXTAREA',
  ];

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
  return target && target.tagName ? nativeInputs.includes(target.tagName) : false;
}

/**
 * Find all contenteditable, textarea and editable input elements passed holder contains
 * @param holder - element where to find inputs
 * @returns - all inputs of the holder element
 */
export function findAllInputs(holder: HTMLElement): HTMLElement[] {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return Array.from(holder.querySelectorAll(allInputsSelector()) as NodeListOf<HTMLElement>)
    /**
     * If contenteditable element contains block elements, treat them as inputs.
     */
    .reduce((result, input) => {
      if (isNativeInput(input) || containsOnlyInlineElements(input)) {
        return [...result, input];
      }

      return [...result, ...getDeepestBlockElements(input)] as HTMLElement[];
    }, []);
}

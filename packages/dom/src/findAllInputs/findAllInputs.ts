import { containsOnlyInlineElements } from '../containsOnlyInlineElements';
import { getDeepestBlockElements } from '../getDeepestBlockElements';
import { allInputsSelector } from '../allInputsSelector';
import { isNativeInput } from '../isNativeInput';

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

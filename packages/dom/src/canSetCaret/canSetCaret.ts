import { isNativeInput } from '../isNativeInput';
import { isContentEditable } from '../isContentEditable';

/**
 * Checks if we can set caret
 * @param target - target to check
 * @returns true if caret can be set in the target element, false otherwise
 */
export function canSetCaret(target: HTMLElement): boolean {
  let result = true;

  if (isNativeInput(target)) {
    switch (target.type) {
      case 'file':
      case 'checkbox':
      case 'radio':
      case 'hidden':
      case 'submit':
      case 'button':
      case 'image':
      case 'reset':
        result = false;
        break;
    }
  } else {
    result = isContentEditable(target);
  }

  return result;
}

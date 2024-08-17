/**
 * Returns CSS selector for all text inputs
 */
export function allInputsSelector(): string {
  const allowedInputTypes = ['text', 'password', 'email', 'number', 'search', 'tel', 'url'];

  return '[contenteditable=true], textarea, input:not([type]), '
    + allowedInputTypes.map(type => `input[type="${type}"]`).join(', ');
}

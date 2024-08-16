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

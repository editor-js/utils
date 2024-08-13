/**
 * Capitalizes first letter of the string
 * @param text - text to be capitalized
 * @returns capitalized text string
 */
export function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

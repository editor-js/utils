/**
 * Capitalizes first letter of the string
 * @param text - text to capitalize
 * @returns
 */
export function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

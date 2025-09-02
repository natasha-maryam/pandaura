/**
 * Text utility functions for common string transformations
 */

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str || typeof str !== 'string') return str || '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalizes the first letter of each word in a string
 * @param str - The string to title case
 * @returns The string with each word's first letter capitalized
 */
export function toTitleCase(str: string): string {
  if (!str || typeof str !== 'string') return str || '';
  return str.split(' ').map(word => capitalizeFirstLetter(word)).join(' ');
}

/**
 * Safely capitalizes a string, handling null/undefined values
 * @param str - The string to capitalize (can be null/undefined)
 * @returns The capitalized string or empty string if input is null/undefined
 */
export function safeCapitalize(str: string | null | undefined): string {
  if (str == null) return '';
  return capitalizeFirstLetter(String(str));
}

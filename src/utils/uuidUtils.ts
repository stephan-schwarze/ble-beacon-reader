/**
 * Utility functions for UUID handling
 */

/**
 * Validates if a string is a valid UUID format
 * @param uuid - The UUID string to validate
 * @returns true if valid UUID format, false otherwise
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Formats a UUID string to uppercase with dashes
 * @param uuid - The UUID string to format
 * @returns Formatted UUID string
 */
export const formatUUID = (uuid: string): string => {
  // Remove any existing dashes and convert to uppercase
  const cleanUuid = uuid.replace(/-/g, '').toUpperCase();
  
  // Add dashes in the correct positions
  if (cleanUuid.length === 32) {
    return [
      cleanUuid.substring(0, 8),
      cleanUuid.substring(8, 12),
      cleanUuid.substring(12, 16),
      cleanUuid.substring(16, 20),
      cleanUuid.substring(20, 32),
    ].join('-');
  }
  
  return uuid.toUpperCase();
};

/**
 * Generates a random UUID v4
 * @returns A random UUID v4 string
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }).toUpperCase();
};

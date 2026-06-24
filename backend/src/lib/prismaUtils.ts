import { Prisma } from '@prisma/client';

/**
 * Safely extracts string values from a Prisma JSON array field.
 * Returns an empty array for null/undefined/non-array values,
 * and filters out any non-string entries from the array.
 */
export const jsonArrayToStringArray = (value: Prisma.JsonValue | null | undefined): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
};

/**
 * Normalizes a transcript string for duplicate comparison.
 * Normalizes line endings and trims whitespace.
 */
export const normalizeTranscriptForComparison = (text: string): string =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

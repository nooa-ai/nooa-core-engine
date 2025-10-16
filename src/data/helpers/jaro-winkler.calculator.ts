/**
 * Jaro-Winkler Distance Calculator
 *
 * Pure implementation of Jaro-Winkler string similarity algorithm.
 * Used for detecting similar strings in code analysis.
 *
 * Following Single Responsibility Principle: Only handles similarity calculation.
 * Extracted from StringSimilarityHelper to reduce file complexity.
 */
export class JaroWinklerCalculator {
  /**
   * Calculates string similarity using Jaro-Winkler distance
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score between 0.0 and 1.0
   */
  calculate(str1: string, str2: string): number {
    // Handle edge cases
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    // Use Jaro similarity algorithm
    const jaroSimilarity = this.calculateJaro(str1, str2);

    // Apply Winkler modification (boost for common prefix)
    const prefixLength = this.getCommonPrefixLength(str1, str2, 4);
    const jaroWinkler = jaroSimilarity + prefixLength * 0.1 * (1 - jaroSimilarity);

    return Math.min(jaroWinkler, 1.0);
  }

  /**
   * Calculates Jaro similarity between two strings
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Jaro similarity score
   */
  private calculateJaro(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Maximum allowed distance for matching characters
    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Identify matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, len2);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    return (
      (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3.0
    );
  }

  /**
   * Calculates the length of common prefix between two strings
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @param maxLength - Maximum prefix length to consider
   * @returns Length of common prefix
   */
  private getCommonPrefixLength(str1: string, str2: string, maxLength: number): number {
    let prefixLength = 0;
    const minLength = Math.min(str1.length, str2.length, maxLength);

    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) {
        prefixLength++;
      } else {
        break;
      }
    }

    return prefixLength;
  }
}

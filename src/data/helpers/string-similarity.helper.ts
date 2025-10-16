import { JaroWinklerCalculator } from './jaro-winkler.calculator';

/**
 * String Similarity Helper
 *
 * Provides string similarity calculation utilities using Jaro-Winkler algorithm.
 * Used for detecting potential synonyms in code symbols.
 *
 * Refactored in v1.4.1 to extract Jaro-Winkler algorithm to separate calculator.
 */
export class StringSimilarityHelper {
  private readonly calculator: JaroWinklerCalculator;

  constructor() {
    this.calculator = new JaroWinklerCalculator();
  }

  /**
   * Calculates string similarity using Jaro-Winkler distance
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score between 0.0 and 1.0
   */
  calculateSimilarity(str1: string, str2: string): number {
    return this.calculator.calculate(str1, str2);
  }

  /**
   * Extracts the file name from a path (without directory and extension)
   *
   * @param path - File path
   * @returns File name
   */
  extractFileName(path: string): string {
    // Get last segment after /
    const segments = path.split('/');
    const fileWithExt = segments[segments.length - 1];

    // Remove extension
    return fileWithExt.replace(/\.(ts|js|tsx|jsx)$/, '');
  }

  /**
   * Normalizes a name by removing common suffixes and applying thesaurus
   *
   * @param name - Original name
   * @param thesaurus - Optional groups of synonyms
   * @returns Normalized name
   */
  normalizeName(name: string, thesaurus?: string[][]): string {
    // Convert to lowercase for case-insensitive comparison
    let normalized = name.toLowerCase();

    // Remove common suffixes
    const suffixes = [
      'usecase',
      'use-case',
      'implementation',
      'impl',
      'adapter',
      'repository',
      'controller',
      'service',
      'factory',
      'builder',
      'creator',
      'generator',
    ];

    for (const suffix of suffixes) {
      normalized = normalized.replace(new RegExp(`[-_.]?${suffix}$`), '');
    }

    // Apply thesaurus substitution
    if (thesaurus) {
      for (const synonymGroup of thesaurus) {
        const lowerGroup = synonymGroup.map((s) => s.toLowerCase());
        // If any synonym is found, replace with the first one (canonical form)
        for (let i = 1; i < lowerGroup.length; i++) {
          const pattern = new RegExp(`\\b${lowerGroup[i]}\\b`, 'g');
          normalized = normalized.replace(pattern, lowerGroup[0]);
        }
      }
    }

    return normalized;
  }
}

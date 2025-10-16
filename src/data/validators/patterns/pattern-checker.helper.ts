/**
 * Pattern Checker Helper
 *
 * Responsible for checking if content contains forbidden patterns or keywords.
 * Extracted from CodePatternValidator to reduce code duplication.
 *
 * Following Single Responsibility Principle: Only handles pattern/keyword checking.
 */
export class PatternCheckerHelper {
  /**
   * Checks if content contains any of the forbidden keywords
   *
   * @param content - File content to check
   * @param keywords - Array of forbidden keywords
   * @returns First matching keyword, or null if none found
   */
  findForbiddenKeyword(content: string, keywords: string[]): string | null {
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        return keyword;
      }
    }
    return null;
  }

  /**
   * Checks if content matches any of the forbidden regex patterns
   *
   * @param content - File content to check
   * @param patterns - Array of forbidden regex patterns (as strings)
   * @returns First matching pattern, or null if none found
   */
  findForbiddenPattern(content: string, patterns: string[]): string | null {
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(content)) {
          return pattern;
        }
      } catch (error) {
        // Invalid regex pattern, skip
        continue;
      }
    }
    return null;
  }
}

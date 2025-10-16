/**
 * File Content Helper
 *
 * Provides utility for reading file contents from cache.
 * Eliminates code duplication across validators.
 *
 * Following DIP: No direct dependency on Node.js fs module.
 * With the new architecture, ALL files are pre-cached by the use case,
 * so this function primarily serves as a type-safe cache accessor.
 */

/**
 * Reads file content from cache
 *
 * @param symbolPath - Relative path to the file
 * @param fileCache - Cache of file contents (should be pre-populated by use case)
 * @returns File content as string, or null if file not in cache
 */
export function readFileContent(
  symbolPath: string,
  fileCache?: Map<string, string>
): string | null {
  try {
    // Check cache
    if (fileCache && fileCache.has(symbolPath)) {
      return fileCache.get(symbolPath)!;
    }

    // If not in cache, file doesn't exist or wasn't cached
    return null;
  } catch (error) {
    return null;
  }
}

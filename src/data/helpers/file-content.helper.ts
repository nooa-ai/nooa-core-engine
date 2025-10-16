/**
 * File Content Helper
 *
 * Provides utility for reading file contents with cache support.
 * Eliminates code duplication across validators.
 */

/**
 * Reads file content from cache or disk
 *
 * @param symbolPath - Relative path to the file
 * @param projectPath - Root project path
 * @param fileCache - Optional cache of file contents
 * @returns File content as string, or null if file cannot be read
 */
export async function readFileContent(
  symbolPath: string,
  projectPath: string,
  fileCache?: Map<string, string>
): Promise<string | null> {
  try {
    // Check cache first
    if (fileCache && fileCache.has(symbolPath)) {
      return fileCache.get(symbolPath)!;
    }

    // Fallback to disk read
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');
    const filePath = path.join(projectPath, symbolPath);
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    // File might not exist or be readable
    return null;
  }
}

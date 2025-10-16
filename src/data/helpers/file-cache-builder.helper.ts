/**
 * Helper: File Cache Builder
 *
 * Responsible for building an in-memory cache of file contents to eliminate redundant I/O.
 * Multiple validators need the same file content, so we read once and share via Map.
 *
 * Performance optimization: Reduces file system calls from O(n*m) to O(n)
 * where n = unique files, m = validators needing that file.
 *
 * Following Single Responsibility Principle: Only handles file caching logic.
 */

import { CodeSymbolModel } from '../../domain/models';
import { IFileReader } from '../protocols';

export class FileCacheBuilderHelper {
  constructor(private readonly fileReader: IFileReader) {}

  /**
   * Builds cache of file contents in memory
   *
   * @param symbols - Code symbols with file paths
   * @param projectPath - Root project path
   * @returns Map of filePath → fileContent
   */
  build(symbols: CodeSymbolModel[], projectPath: string): Map<string, string> {
    const fileCache = new Map<string, string>();

    // Get unique file paths
    const uniqueFilePaths = [...new Set(symbols.map((s) => s.path))];

    // Read all files using injected fileReader (respects DIP)
    uniqueFilePaths.forEach((symbolPath) => {
      try {
        // Build full path: projectPath + symbolPath
        const fullPath = `${projectPath}/${symbolPath}`.replace(/\/+/g, '/');
        const content = this.fileReader.readFileSync(fullPath, 'utf-8');
        fileCache.set(symbolPath, content);
      } catch (error) {
        // File might not exist or be readable, skip (cache miss handled by validators)
      }
    });

    return fileCache;
  }
}

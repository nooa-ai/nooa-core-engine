/**
 * File Reader Protocol
 *
 * Single-responsibility interface for reading file contents.
 * Follows Interface Segregation Principle (ISP) - exactly 1 method.
 *
 * Why segregated: Reading and existence checking are different concerns.
 * Consumers that only need to read don't need existence checking capability.
 */
export interface IFileReader {
  /**
   * Read file content synchronously
   * @param path - File path
   * @param encoding - File encoding (default: 'utf-8')
   * @returns File content as string
   * @throws Error if file doesn't exist or can't be read
   */
  readFileSync(path: string, encoding?: BufferEncoding): string;
}

/**
 * File Existence Checker Protocol
 *
 * Single-responsibility interface for checking file existence.
 * Follows Interface Segregation Principle (ISP) - exactly 1 method.
 *
 * Why segregated: Existence checking doesn't require reading capability.
 * Consumers that only need to check existence don't need reading capability.
 */
export interface IFileExistenceChecker {
  /**
   * Check if file exists
   * @param path - File path
   * @returns True if file exists, false otherwise
   */
  existsSync(path: string): boolean;
}

/**
 * @deprecated Use IFileReader and IFileExistenceChecker instead
 * This interface violates ISP by combining two separate concerns.
 * Kept for backward compatibility during migration.
 */
export interface IFileSystem extends IFileReader, IFileExistenceChecker {}

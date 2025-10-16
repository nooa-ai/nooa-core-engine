/**
 * Unit tests for FileContentHelper
 */
import { describe, it, expect } from 'vitest';
import { readFileContent } from '../../../src/data/helpers/file-content.helper';

describe('FileContentHelper', () => {
  const symbolPath = 'src/test.ts';
  const fileContent = 'export const test = "hello";';

  describe('readFileContent', () => {
    it('should return content from cache when available', () => {
      const fileCache = new Map<string, string>();
      fileCache.set(symbolPath, fileContent);

      const result = readFileContent(symbolPath, fileCache);

      expect(result).toBe(fileContent);
    });

    it('should return null when cache is not provided', () => {
      const result = readFileContent(symbolPath);

      expect(result).toBeNull();
    });

    it('should return null when cache miss', () => {
      const fileCache = new Map<string, string>();
      fileCache.set('other/file.ts', 'other content');

      const result = readFileContent(symbolPath, fileCache);

      expect(result).toBeNull();
    });

    it('should return null when file not in cache', () => {
      const fileCache = new Map<string, string>();

      const result = readFileContent(symbolPath, fileCache);

      expect(result).toBeNull();
    });

    it('should handle empty file content', () => {
      const fileCache = new Map<string, string>();
      fileCache.set(symbolPath, '');

      const result = readFileContent(symbolPath, fileCache);

      expect(result).toBe('');
    });

    it('should handle multiline content from cache', () => {
      const multilineContent = 'line1\nline2\nline3';
      const fileCache = new Map<string, string>();
      fileCache.set(symbolPath, multilineContent);

      const result = readFileContent(symbolPath, fileCache);

      expect(result).toBe(multilineContent);
    });

    it('should handle large content', () => {
      const largeContent = 'x'.repeat(10000);
      const fileCache = new Map<string, string>();
      fileCache.set(symbolPath, largeContent);

      const result = readFileContent(symbolPath, fileCache);

      expect(result).toBe(largeContent);
    });

    it('should handle special characters in content', () => {
      const specialContent = '/* Comment */ @decorator\n"string" \'char\' \n\ttab';
      const fileCache = new Map<string, string>();
      fileCache.set(symbolPath, specialContent);

      const result = readFileContent(symbolPath, fileCache);

      expect(result).toBe(specialContent);
    });
  });
});

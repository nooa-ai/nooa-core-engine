/**
 * Unit tests for FileContentHelper
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileContent } from '../../../src/data/helpers/file-content.helper';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

describe('FileContentHelper', () => {
  const projectPath = '/project';
  const symbolPath = 'src/test.ts';
  const fileContent = 'export const test = "hello";';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readFileContent', () => {
    it('should return content from cache when available', async () => {
      const fileCache = new Map<string, string>();
      fileCache.set(symbolPath, fileContent);

      const result = await readFileContent(symbolPath, projectPath, fileCache);

      expect(result).toBe(fileContent);
      expect(fs.promises.readFile).not.toHaveBeenCalled();
    });

    it('should read from disk when cache is not provided', async () => {
      vi.mocked(fs.promises.readFile).mockResolvedValue(fileContent);

      const result = await readFileContent(symbolPath, projectPath);

      expect(result).toBe(fileContent);
      expect(fs.promises.readFile).toHaveBeenCalledWith(
        path.join(projectPath, symbolPath),
        'utf-8'
      );
    });

    it('should read from disk when cache miss', async () => {
      const fileCache = new Map<string, string>();
      fileCache.set('other/file.ts', 'other content');
      vi.mocked(fs.promises.readFile).mockResolvedValue(fileContent);

      const result = await readFileContent(symbolPath, projectPath, fileCache);

      expect(result).toBe(fileContent);
      expect(fs.promises.readFile).toHaveBeenCalledWith(
        path.join(projectPath, symbolPath),
        'utf-8'
      );
    });

    it('should return null when file cannot be read', async () => {
      vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('ENOENT'));

      const result = await readFileContent(symbolPath, projectPath);

      expect(result).toBeNull();
    });

    it('should return null when file read throws permission error', async () => {
      vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('EACCES'));

      const result = await readFileContent(symbolPath, projectPath);

      expect(result).toBeNull();
    });

    it('should handle empty file content', async () => {
      const fileCache = new Map<string, string>();
      fileCache.set(symbolPath, '');

      const result = await readFileContent(symbolPath, projectPath, fileCache);

      expect(result).toBe('');
    });

    it('should handle multiline content from cache', async () => {
      const multilineContent = 'line1\nline2\nline3';
      const fileCache = new Map<string, string>();
      fileCache.set(symbolPath, multilineContent);

      const result = await readFileContent(symbolPath, projectPath, fileCache);

      expect(result).toBe(multilineContent);
    });

    it('should construct correct file path for nested files', async () => {
      const nestedPath = 'src/domain/models/test.model.ts';
      vi.mocked(fs.promises.readFile).mockResolvedValue(fileContent);

      await readFileContent(nestedPath, projectPath);

      expect(fs.promises.readFile).toHaveBeenCalledWith(
        path.join(projectPath, nestedPath),
        'utf-8'
      );
    });
  });
});

/**
 * Unit tests for FileCacheBuilderHelper
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { FileCacheBuilderHelper } from '../../../src/data/helpers/file-cache-builder.helper';
import { CodeSymbolModel } from '../../../src/domain/models';
import { FileReaderSpy } from '../mocks';

describe('FileCacheBuilderHelper', () => {
  let fileReaderSpy: FileReaderSpy;
  let sut: FileCacheBuilderHelper;

  beforeEach(() => {
    fileReaderSpy = new FileReaderSpy();
    sut = new FileCacheBuilderHelper(fileReaderSpy);
  });

  describe('build', () => {
    it('should cache unique files only (eliminate duplicates)', () => {
      const symbols: CodeSymbolModel[] = [
        { path: 'src/file1.ts', name: 'File1', role: 'NOUN', dependencies: [] },
        { path: 'src/file1.ts', name: 'File1', role: 'NOUN', dependencies: [] }, // duplicate
        { path: 'src/file2.ts', name: 'File2', role: 'NOUN', dependencies: [] },
      ];

      fileReaderSpy.fileContents.set('/project/src/file1.ts', 'content1');
      fileReaderSpy.fileContents.set('/project/src/file2.ts', 'content2');

      const cache = sut.build(symbols, '/project');

      expect(cache.size).toBe(2);
      expect(fileReaderSpy.callCount).toBe(2); // Only 2 reads, not 3
      expect(cache.get('src/file1.ts')).toBe('content1');
      expect(cache.get('src/file2.ts')).toBe('content2');
    });

    it('should read files using injected IFileReader', () => {
      const symbols: CodeSymbolModel[] = [
        { path: 'src/test.ts', name: 'Test', role: 'NOUN', dependencies: [] },
      ];

      fileReaderSpy.fileContents.set('/project/src/test.ts', 'test content');

      const cache = sut.build(symbols, '/project');

      expect(fileReaderSpy.callCount).toBe(1);
      expect(fileReaderSpy.lastPath).toBe('/project/src/test.ts');
      expect(cache.get('src/test.ts')).toBe('test content');
    });

    it('should skip files that do not exist (no throw)', () => {
      const symbols: CodeSymbolModel[] = [
        { path: 'src/exists.ts', name: 'Exists', role: 'NOUN', dependencies: [] },
        { path: 'src/missing.ts', name: 'Missing', role: 'NOUN', dependencies: [] },
      ];

      fileReaderSpy.fileContents.set('/project/src/exists.ts', 'exists content');
      // src/missing.ts not added to spy - will throw error

      const cache = sut.build(symbols, '/project');

      // Should not throw, just skip the missing file
      expect(cache.size).toBe(1);
      expect(cache.get('src/exists.ts')).toBe('exists content');
      expect(cache.get('src/missing.ts')).toBeUndefined();
    });

    it('should normalize paths (replace multiple slashes)', () => {
      const symbols: CodeSymbolModel[] = [
        { path: 'src/nested/file.ts', name: 'File', role: 'NOUN', dependencies: [] },
      ];

      // Setup with normalized path
      fileReaderSpy.fileContents.set('/project/src/nested/file.ts', 'nested content');

      const cache = sut.build(symbols, '/project');

      expect(fileReaderSpy.lastPath).toBe('/project/src/nested/file.ts');
      expect(cache.get('src/nested/file.ts')).toBe('nested content');
    });

    it('should normalize paths with multiple slashes', () => {
      const symbols: CodeSymbolModel[] = [
        { path: 'src//nested///file.ts', name: 'File', role: 'NOUN', dependencies: [] },
      ];

      // Path should be normalized to single slashes
      fileReaderSpy.fileContents.set('/project/src/nested/file.ts', 'content');

      const cache = sut.build(symbols, '/project');

      expect(fileReaderSpy.lastPath).toBe('/project/src/nested/file.ts'); // normalized
    });

    it('should return empty cache when no symbols', () => {
      const symbols: CodeSymbolModel[] = [];

      const cache = sut.build(symbols, '/project');

      expect(cache.size).toBe(0);
      expect(fileReaderSpy.callCount).toBe(0);
    });

    it('should cache multiple files correctly', () => {
      const symbols: CodeSymbolModel[] = [
        { path: 'src/file1.ts', name: 'File1', role: 'NOUN', dependencies: [] },
        { path: 'src/file2.ts', name: 'File2', role: 'VERB', dependencies: [] },
        { path: 'src/file3.ts', name: 'File3', role: 'ADVERB', dependencies: [] },
      ];

      fileReaderSpy.fileContents.set('/project/src/file1.ts', 'content1');
      fileReaderSpy.fileContents.set('/project/src/file2.ts', 'content2');
      fileReaderSpy.fileContents.set('/project/src/file3.ts', 'content3');

      const cache = sut.build(symbols, '/project');

      expect(cache.size).toBe(3);
      expect(cache.get('src/file1.ts')).toBe('content1');
      expect(cache.get('src/file2.ts')).toBe('content2');
      expect(cache.get('src/file3.ts')).toBe('content3');
    });

    it('should handle empty file content', () => {
      const symbols: CodeSymbolModel[] = [
        { path: 'src/empty.ts', name: 'Empty', role: 'NOUN', dependencies: [] },
      ];

      fileReaderSpy.fileContents.set('/project/src/empty.ts', '');

      const cache = sut.build(symbols, '/project');

      expect(cache.get('src/empty.ts')).toBe('');
    });

    it('should handle multiline content', () => {
      const multilineContent = 'line1\nline2\nline3\nline4';
      const symbols: CodeSymbolModel[] = [
        { path: 'src/multiline.ts', name: 'Multiline', role: 'NOUN', dependencies: [] },
      ];

      fileReaderSpy.fileContents.set('/project/src/multiline.ts', multilineContent);

      const cache = sut.build(symbols, '/project');

      expect(cache.get('src/multiline.ts')).toBe(multilineContent);
    });

    it('should handle large files', () => {
      const largeContent = 'x'.repeat(100000);
      const symbols: CodeSymbolModel[] = [
        { path: 'src/large.ts', name: 'Large', role: 'NOUN', dependencies: [] },
      ];

      fileReaderSpy.fileContents.set('/project/src/large.ts', largeContent);

      const cache = sut.build(symbols, '/project');

      expect(cache.get('src/large.ts')).toBe(largeContent);
    });

    it('should handle special characters in content', () => {
      const specialContent = '/* Comment */ @decorator\n"string" \'char\' \n\ttab\r\nwindows';
      const symbols: CodeSymbolModel[] = [
        { path: 'src/special.ts', name: 'Special', role: 'NOUN', dependencies: [] },
      ];

      fileReaderSpy.fileContents.set('/project/src/special.ts', specialContent);

      const cache = sut.build(symbols, '/project');

      expect(cache.get('src/special.ts')).toBe(specialContent);
    });

    it('should use symbol path as cache key (not full path)', () => {
      const symbols: CodeSymbolModel[] = [
        { path: 'src/test.ts', name: 'Test', role: 'NOUN', dependencies: [] },
      ];

      fileReaderSpy.fileContents.set('/project/src/test.ts', 'content');

      const cache = sut.build(symbols, '/project');

      // Cache key should be symbol path, not full path
      expect(cache.has('src/test.ts')).toBe(true);
      expect(cache.has('/project/src/test.ts')).toBe(false);
    });

    it('should handle different project paths correctly', () => {
      const symbols: CodeSymbolModel[] = [
        { path: 'src/test.ts', name: 'Test', role: 'NOUN', dependencies: [] },
      ];

      fileReaderSpy.fileContents.set('/different/path/src/test.ts', 'content');

      const cache = sut.build(symbols, '/different/path');

      expect(fileReaderSpy.lastPath).toBe('/different/path/src/test.ts');
      expect(cache.get('src/test.ts')).toBe('content');
    });
  });
});

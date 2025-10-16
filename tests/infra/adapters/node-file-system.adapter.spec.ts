/**
 * Unit tests for NodeFileSystemAdapter
 */
import { describe, it, expect, vi } from 'vitest';
import { NodeFileSystemAdapter } from '../../../src/infra/adapters/node-file-system.adapter';

describe('NodeFileSystemAdapter', () => {
  describe('IFileReader implementation', () => {
    it('should read file content with default UTF-8 encoding', () => {
      const mockFs = {
        readFileSync: vi.fn().mockReturnValue('file content'),
        existsSync: vi.fn(),
      } as any;

      const sut = new NodeFileSystemAdapter(mockFs);
      const result = sut.readFileSync('/path/to/file.txt');

      expect(result).toBe('file content');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/file.txt', 'utf-8');
    });

    it('should read file content with custom encoding', () => {
      const mockFs = {
        readFileSync: vi.fn().mockReturnValue('binary content'),
        existsSync: vi.fn(),
      } as any;

      const sut = new NodeFileSystemAdapter(mockFs);
      const result = sut.readFileSync('/path/to/file.bin', 'binary');

      expect(result).toBe('binary content');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/file.bin', 'binary');
    });

    it('should throw error when file cannot be read', () => {
      const mockFs = {
        readFileSync: vi.fn().mockImplementation(() => {
          throw new Error('ENOENT: no such file or directory');
        }),
        existsSync: vi.fn(),
      } as any;

      const sut = new NodeFileSystemAdapter(mockFs);

      expect(() => sut.readFileSync('/invalid/path.txt')).toThrow('ENOENT: no such file or directory');
    });
  });

  describe('IFileExistenceChecker implementation', () => {
    it('should return true when file exists', () => {
      const mockFs = {
        readFileSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(true),
      } as any;

      const sut = new NodeFileSystemAdapter(mockFs);
      const result = sut.existsSync('/path/to/existing-file.txt');

      expect(result).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/existing-file.txt');
    });

    it('should return false when file does not exist', () => {
      const mockFs = {
        readFileSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(false),
      } as any;

      const sut = new NodeFileSystemAdapter(mockFs);
      const result = sut.existsSync('/path/to/missing-file.txt');

      expect(result).toBe(false);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/missing-file.txt');
    });
  });

  describe('Interface Segregation Principle', () => {
    it('should implement IFileReader independently', () => {
      const mockFs = {
        readFileSync: vi.fn().mockReturnValue('content'),
        existsSync: vi.fn(),
      } as any;

      const sut = new NodeFileSystemAdapter(mockFs);

      // Consumer only needs IFileReader, doesn't need to know about existsSync
      const fileReader = sut as { readFileSync(path: string, encoding?: BufferEncoding): string };
      const content = fileReader.readFileSync('/test.txt');

      expect(content).toBe('content');
      expect(mockFs.readFileSync).toHaveBeenCalled();
      expect(mockFs.existsSync).not.toHaveBeenCalled();
    });

    it('should implement IFileExistenceChecker independently', () => {
      const mockFs = {
        readFileSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(true),
      } as any;

      const sut = new NodeFileSystemAdapter(mockFs);

      // Consumer only needs IFileExistenceChecker, doesn't need to know about readFileSync
      const existenceChecker = sut as { existsSync(path: string): boolean };
      const exists = existenceChecker.existsSync('/test.txt');

      expect(exists).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalled();
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });
  });

  describe('Default constructor behavior', () => {
    it('should use real fs module when no mock provided', () => {
      // This test verifies the default parameter works
      // We can't easily test real fs without file system side effects
      // So we just verify the adapter can be constructed without errors
      expect(() => new NodeFileSystemAdapter()).not.toThrow();
    });
  });
});

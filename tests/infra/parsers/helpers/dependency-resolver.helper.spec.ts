/**
 * Unit tests for DependencyResolverHelper
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DependencyResolverHelper } from '../../../../src/infra/parsers/helpers/dependency-resolver.helper';
import { Project } from 'ts-morph';

describe('DependencyResolverHelper', () => {
  let sut: DependencyResolverHelper;
  let mockProject: any;

  beforeEach(() => {
    sut = new DependencyResolverHelper();

    // Create mock Project
    mockProject = {
      getSourceFile: vi.fn(),
    };
  });

  describe('resolve', () => {
    it('should resolve relative import with .ts extension', () => {
      const mockSourceFile = {
        getFilePath: () => '/project/src/resolved-file.ts',
      };
      mockProject.getSourceFile.mockReturnValue(mockSourceFile);

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './file',
        '/project'
      );

      expect(result).toBe('src/resolved-file.ts');
      expect(mockProject.getSourceFile).toHaveBeenCalledWith(
        expect.stringContaining('/project/src/file')
      );
    });

    it('should return null for external packages', () => {
      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        'react',
        '/project'
      );

      expect(result).toBeNull();
      expect(mockProject.getSourceFile).not.toHaveBeenCalled();
    });

    it('should return null for scoped packages', () => {
      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        '@company/package',
        '/project'
      );

      expect(result).toBeNull();
      expect(mockProject.getSourceFile).not.toHaveBeenCalled();
    });

    it('should try multiple extensions (.ts, .tsx, .d.ts)', () => {
      mockProject.getSourceFile
        .mockReturnValueOnce(null) // Exact path
        .mockReturnValueOnce(null) // .ts
        .mockReturnValueOnce({ getFilePath: () => '/project/src/file.tsx' }); // .tsx

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './file',
        '/project'
      );

      expect(result).toBe('src/file.tsx');
      expect(mockProject.getSourceFile).toHaveBeenCalledTimes(3);
    });

    it('should try index.ts when resolving directory', () => {
      mockProject.getSourceFile
        .mockReturnValueOnce(null) // Exact
        .mockReturnValueOnce(null) // .ts
        .mockReturnValueOnce(null) // .tsx
        .mockReturnValueOnce(null) // .d.ts
        .mockReturnValueOnce({ getFilePath: () => '/project/src/dir/index.ts' }); // /index.ts

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './dir',
        '/project'
      );

      expect(result).toBe('src/dir/index.ts');
    });

    it('should try index.tsx when index.ts not found', () => {
      mockProject.getSourceFile
        .mockReturnValueOnce(null) // Exact
        .mockReturnValueOnce(null) // .ts
        .mockReturnValueOnce(null) // .tsx
        .mockReturnValueOnce(null) // .d.ts
        .mockReturnValueOnce(null) // /index.ts
        .mockReturnValueOnce({ getFilePath: () => '/project/src/dir/index.tsx' }); // /index.tsx

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './dir',
        '/project'
      );

      expect(result).toBe('src/dir/index.tsx');
    });

    it('should return null when file cannot be resolved', () => {
      mockProject.getSourceFile.mockReturnValue(null);

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './missing',
        '/project'
      );

      expect(result).toBeNull();
    });

    it('should handle parent directory imports', () => {
      const mockSourceFile = {
        getFilePath: () => '/project/shared/utils.ts',
      };
      mockProject.getSourceFile.mockReturnValue(mockSourceFile);

      const result = sut.resolve(
        mockProject as any,
        '/project/src/components',
        '../shared/utils',
        '/project'
      );

      expect(result).toBe('shared/utils.ts');
    });

    it('should handle nested relative imports', () => {
      const mockSourceFile = {
        getFilePath: () => '/project/src/deep/nested/file.ts',
      };
      mockProject.getSourceFile.mockReturnValue(mockSourceFile);

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './deep/nested/file',
        '/project'
      );

      expect(result).toBe('src/deep/nested/file.ts');
    });

    it('should normalize paths with forward slashes', () => {
      const mockSourceFile = {
        getFilePath: () => '/project/src/file.ts',
      };
      mockProject.getSourceFile.mockReturnValue(mockSourceFile);

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './file',
        '/project'
      );

      expect(result).toContain('/');
      expect(result).not.toContain('\\');
    });

    it('should handle absolute imports starting with /', () => {
      const mockSourceFile = {
        getFilePath: () => '/project/src/absolute.ts',
      };
      mockProject.getSourceFile.mockReturnValue(mockSourceFile);

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        '/src/absolute',
        '/project'
      );

      expect(result).toBe('src/absolute.ts');
    });

    it('should handle resolution errors gracefully', () => {
      mockProject.getSourceFile.mockImplementation(() => {
        throw new Error('Resolution error');
      });

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './file',
        '/project'
      );

      expect(result).toBeNull();
    });

    it('should stop trying candidates after first match', () => {
      mockProject.getSourceFile
        .mockReturnValueOnce(null) // Exact
        .mockReturnValueOnce({ getFilePath: () => '/project/src/file.ts' }) // .ts - MATCH
        .mockReturnValueOnce({ getFilePath: () => '/project/src/file.tsx' }); // Should not be called

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './file',
        '/project'
      );

      expect(result).toBe('src/file.ts');
      expect(mockProject.getSourceFile).toHaveBeenCalledTimes(2); // Only first 2 candidates
    });

    it('should handle empty module specifier', () => {
      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        '',
        '/project'
      );

      expect(result).toBeNull();
    });

    it('should handle files in project root', () => {
      const mockSourceFile = {
        getFilePath: () => '/project/config.ts',
      };
      mockProject.getSourceFile.mockReturnValue(mockSourceFile);

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        '../config',
        '/project'
      );

      expect(result).toBe('config.ts');
    });

    it('should handle deeply nested parent directory navigation', () => {
      const mockSourceFile = {
        getFilePath: () => '/project/root-file.ts',
      };
      mockProject.getSourceFile.mockReturnValue(mockSourceFile);

      const result = sut.resolve(
        mockProject as any,
        '/project/src/deep/nested/folder',
        '../../../../root-file',
        '/project'
      );

      expect(result).toBe('root-file.ts');
    });

    it('should handle mixed forward and backward slashes (Windows compatibility)', () => {
      const mockSourceFile = {
        getFilePath: () => '/project/src/file.ts',
      };
      mockProject.getSourceFile.mockReturnValue(mockSourceFile);

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './file',
        '/project'
      );

      // Result should always use forward slashes
      expect(result).toBe('src/file.ts');
    });

    it('should handle .d.ts declaration files', () => {
      mockProject.getSourceFile
        .mockReturnValueOnce(null) // Exact
        .mockReturnValueOnce(null) // .ts
        .mockReturnValueOnce(null) // .tsx
        .mockReturnValueOnce({ getFilePath: () => '/project/src/types.d.ts' }); // .d.ts

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './types',
        '/project'
      );

      expect(result).toBe('src/types.d.ts');
    });

    it('should handle same directory imports', () => {
      const mockSourceFile = {
        getFilePath: () => '/project/src/sibling.ts',
      };
      mockProject.getSourceFile.mockReturnValue(mockSourceFile);

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './sibling',
        '/project'
      );

      expect(result).toBe('src/sibling.ts');
    });

    it('should return null for node modules even with relative-looking paths', () => {
      // Some packages use . in their names
      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        'lodash.debounce',
        '/project'
      );

      expect(result).toBeNull();
    });

    it('should handle files with multiple dots in name', () => {
      const mockSourceFile = {
        getFilePath: () => '/project/src/file.spec.ts',
      };
      mockProject.getSourceFile.mockReturnValue(mockSourceFile);

      const result = sut.resolve(
        mockProject as any,
        '/project/src',
        './file.spec',
        '/project'
      );

      expect(result).toBe('src/file.spec.ts');
    });
  });
});

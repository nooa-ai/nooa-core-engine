/**
 * Unit tests for FileSizeValidator
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSizeValidator } from '../../../../src/data/validators/metrics/file-size.validator';
import { CodeSymbolModel, FileSizeRule } from '../../../../src/domain/models';

const readFileContentMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../src/data/helpers', () => ({
  readFileContent: readFileContentMock,
  RoleMatcherHelper: class {
    matches(symbolRole: string, ruleRole: string) {
      // Simple glob pattern matching
      if (ruleRole === '*') return true;
      return symbolRole === ruleRole;
    }
  },
  ViolationDeduplicatorHelper: class {},
  RuleExtractorHelper: class {},
  StringSimilarityHelper: class {},
}));

describe('FileSizeValidator', () => {
  const projectPath = '/project';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const makeSymbol = (overrides?: Partial<CodeSymbolModel>): CodeSymbolModel => ({
    name: 'TestClass',
    type: 'class',
    path: 'src/test.ts',
    role: 'UseCase',
    dependencies: [],
    ...overrides,
  });

  const makeRule = (overrides?: Partial<FileSizeRule>): FileSizeRule => ({
    type: 'file_size',
    name: 'file-size-limit',
    severity: 'error',
    for: { role: '*' },
    max_lines: 100,
    ...overrides,
  });

  describe('validate', () => {
    it('should return no violations when file is within size limit', async () => {
      const rule = makeRule({ max_lines: 100 });
      const symbol = makeSymbol();
      const fileContent = 'line1\nline2\nline3'; // 3 lines

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new FileSizeValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should return violation when file exceeds size limit', async () => {
      const rule = makeRule({ max_lines: 2 });
      const symbol = makeSymbol({ path: 'src/large-file.ts' });
      const fileContent = 'line1\nline2\nline3'; // 3 lines

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new FileSizeValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ruleName: 'file-size-limit',
        severity: 'error',
        file: 'src/large-file.ts',
        fromRole: 'UseCase',
      });
      expect(result[0].message).toContain('has 3 lines');
      expect(result[0].message).toContain('exceeds 2 limit');
    });

    it('should include comment in violation message when provided', async () => {
      const rule = makeRule({
        max_lines: 2,
        comment: 'Files should be small and focused'
      });
      const symbol = makeSymbol();
      const fileContent = 'line1\nline2\nline3';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new FileSizeValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result[0].message).toContain('Files should be small and focused');
    });

    it('should skip files that cannot be read', async () => {
      const rule = makeRule({ max_lines: 2 });
      const symbol = makeSymbol();

      readFileContentMock.mockReturnValue(null);

      const sut = new FileSizeValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should only validate symbols matching role pattern', async () => {
      const rule = makeRule({
        max_lines: 2,
        for: { role: 'Controller' }
      });
      const symbol1 = makeSymbol({ role: 'Controller', path: 'controller.ts' });
      const symbol2 = makeSymbol({ role: 'UseCase', path: 'usecase.ts' });
      const fileContent = 'line1\nline2\nline3';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new FileSizeValidator([rule]);
      const result = await sut.validate([symbol1, symbol2], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0].file).toBe('controller.ts');
    });

    it('should validate multiple symbols in parallel', async () => {
      const rule = makeRule({ max_lines: 2 });
      const symbols = [
        makeSymbol({ path: 'file1.ts' }),
        makeSymbol({ path: 'file2.ts' }),
        makeSymbol({ path: 'file3.ts' }),
      ];
      const fileContent = 'line1\nline2\nline3';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new FileSizeValidator([rule]);
      const result = await sut.validate(symbols, projectPath);

      expect(result).toHaveLength(3);
      expect(readFileContentMock).toHaveBeenCalledTimes(3);
    });

    it('should apply multiple rules to same symbols', async () => {
      const rules = [
        makeRule({ name: 'rule1', max_lines: 2 }),
        makeRule({ name: 'rule2', max_lines: 3 }),
      ];
      const symbol = makeSymbol();
      const fileContent = 'line1\nline2\nline3\nline4'; // 4 lines

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new FileSizeValidator(rules);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(2);
      expect(result[0].ruleName).toBe('rule1');
      expect(result[1].ruleName).toBe('rule2');
    });

    it('should use file cache when provided', async () => {
      const rule = makeRule({ max_lines: 2 });
      const symbol = makeSymbol();
      const fileCache = new Map<string, string>();
      fileCache.set('src/test.ts', 'line1\nline2\nline3');

      readFileContentMock.mockImplementation(
        (path, cache) => cache?.get(path) || null
      );

      const sut = new FileSizeValidator([rule]);
      const result = await sut.validate([symbol], projectPath, fileCache);

      expect(result).toHaveLength(1);
      expect(readFileContentMock).toHaveBeenCalledWith(
        'src/test.ts',
        fileCache
      );
    });

    it('should handle single-line files', async () => {
      const rule = makeRule({ max_lines: 1 });
      const symbol = makeSymbol();
      const fileContent = 'single line';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new FileSizeValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should handle empty files', async () => {
      const rule = makeRule({ max_lines: 10 });
      const symbol = makeSymbol();
      const fileContent = '';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new FileSizeValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should handle file exactly at limit', async () => {
      const rule = makeRule({ max_lines: 3 });
      const symbol = makeSymbol();
      const fileContent = 'line1\nline2\nline3';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new FileSizeValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should return violation when file has one line over limit', async () => {
      const rule = makeRule({ max_lines: 3 });
      const symbol = makeSymbol();
      const fileContent = 'line1\nline2\nline3\nline4';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new FileSizeValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0].message).toContain('has 4 lines');
    });
  });
});

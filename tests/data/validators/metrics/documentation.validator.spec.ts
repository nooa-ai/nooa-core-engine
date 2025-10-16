/**
 * Unit tests for DocumentationValidator
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentationValidator } from '../../../../src/data/validators/metrics/documentation.validator';
import { CodeSymbolModel, DocumentationRequiredRule } from '../../../../src/domain/models';

const readFileContentMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../src/data/helpers', () => ({
  readFileContent: readFileContentMock,
  RoleMatcherHelper: class {
    matches(symbolRole: string, ruleRole: string) {
      if (ruleRole === '*') return true;
      return symbolRole === ruleRole;
    }
  },
  ViolationDeduplicatorHelper: class {},
  RuleExtractorHelper: class {},
  StringSimilarityHelper: class {},
}));

describe('DocumentationValidator', () => {
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

  const makeRule = (overrides?: Partial<DocumentationRequiredRule>): DocumentationRequiredRule => ({
    type: 'documentation_required',
    name: 'jsdoc-required',
    severity: 'warning',
    for: { role: '*' },
    min_lines: 50,
    requires_jsdoc: true,
    ...overrides,
  });

  describe('validate', () => {
    it('should return no violations when file is below min_lines threshold', async () => {
      const rule = makeRule({ min_lines: 50 });
      const symbol = makeSymbol();
      const fileContent = 'line1\nline2\nline3'; // 3 lines, below 50

      readFileContentMock.mockResolvedValue(fileContent);

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should return no violations when file has JSDoc and is above min_lines', async () => {
      const rule = makeRule({ min_lines: 3 });
      const symbol = makeSymbol();
      const fileContent = '/**\n * JSDoc comment\n */\nclass Test {}';

      readFileContentMock.mockResolvedValue(fileContent);

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should return violation when file lacks JSDoc and is above min_lines', async () => {
      const rule = makeRule({ min_lines: 3 });
      const symbol = makeSymbol({ path: 'src/undocumented.ts' });
      const fileContent = 'line1\nline2\nline3\nline4'; // 4 lines, no JSDoc

      readFileContentMock.mockResolvedValue(fileContent);

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ruleName: 'jsdoc-required',
        severity: 'warning',
        file: 'src/undocumented.ts',
        fromRole: 'UseCase',
      });
      expect(result[0].message).toContain('lacks JSDoc documentation');
      expect(result[0].message).toContain('4 lines');
    });

    it('should include comment in violation message when provided', async () => {
      const rule = makeRule({
        min_lines: 3,
        comment: 'Complex files need documentation'
      });
      const symbol = makeSymbol();
      const fileContent = 'line1\nline2\nline3\nline4';

      readFileContentMock.mockResolvedValue(fileContent);

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result[0].message).toContain('Complex files need documentation');
    });

    it('should skip files that cannot be read', async () => {
      const rule = makeRule({ min_lines: 3 });
      const symbol = makeSymbol();

      readFileContentMock.mockResolvedValue(null);

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should only validate symbols matching role pattern', async () => {
      const rule = makeRule({
        min_lines: 3,
        for: { role: 'Controller' }
      });
      const symbol1 = makeSymbol({ role: 'Controller', path: 'controller.ts' });
      const symbol2 = makeSymbol({ role: 'UseCase', path: 'usecase.ts' });
      const fileContent = 'line1\nline2\nline3\nline4';

      readFileContentMock.mockResolvedValue(fileContent);

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate([symbol1, symbol2], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0].file).toBe('controller.ts');
    });

    it('should handle file exactly at min_lines threshold with JSDoc', async () => {
      const rule = makeRule({ min_lines: 4 });
      const symbol = makeSymbol();
      const fileContent = '/**\n * Doc\n */\nclass Test {}'; // exactly 4 lines

      readFileContentMock.mockResolvedValue(fileContent);

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should handle file exactly at min_lines threshold without JSDoc', async () => {
      const rule = makeRule({ min_lines: 4 });
      const symbol = makeSymbol();
      const fileContent = 'line1\nline2\nline3\nline4'; // exactly 4 lines

      readFileContentMock.mockResolvedValue(fileContent);

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(1);
    });

    it('should validate multiple symbols in parallel', async () => {
      const rule = makeRule({ min_lines: 3 });
      const symbols = [
        makeSymbol({ path: 'file1.ts' }),
        makeSymbol({ path: 'file2.ts' }),
        makeSymbol({ path: 'file3.ts' }),
      ];
      const fileContent = 'line1\nline2\nline3\nline4';

      readFileContentMock.mockResolvedValue(fileContent);

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate(symbols, projectPath);

      expect(result).toHaveLength(3);
      expect(readFileContentMock).toHaveBeenCalledTimes(3);
    });

    it('should apply multiple rules to same symbols', async () => {
      const rules = [
        makeRule({ name: 'rule1', min_lines: 3 }),
        makeRule({ name: 'rule2', min_lines: 4 }),
      ];
      const symbol = makeSymbol();
      const fileContent = 'line1\nline2\nline3\nline4\nline5'; // 5 lines, no JSDoc

      readFileContentMock.mockResolvedValue(fileContent);

      const sut = new DocumentationValidator(rules);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(2);
      expect(result[0].ruleName).toBe('rule1');
      expect(result[1].ruleName).toBe('rule2');
    });

    it('should use file cache when provided', async () => {
      const rule = makeRule({ min_lines: 3 });
      const symbol = makeSymbol();
      const fileCache = new Map<string, string>();
      fileCache.set('src/test.ts', 'line1\nline2\nline3\nline4');

      readFileContentMock.mockImplementation(
        async (path, project, cache) => cache?.get(path) || null
      );

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate([symbol], projectPath, fileCache);

      expect(result).toHaveLength(1);
      expect(readFileContentMock).toHaveBeenCalledWith(
        'src/test.ts',
        projectPath,
        fileCache
      );
    });

    it('should detect JSDoc with various formatting', async () => {
      const rule = makeRule({ min_lines: 3 });
      const symbol = makeSymbol();
      const fileContent = '  /**  \n   * Docs\n   */\nclass Test {}';

      readFileContentMock.mockResolvedValue(fileContent);

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should not accept single-line comments as JSDoc', async () => {
      const rule = makeRule({ min_lines: 3 });
      const symbol = makeSymbol();
      const fileContent = '// comment\n/* block comment */\nclass Test {}';

      readFileContentMock.mockResolvedValue(fileContent);

      const sut = new DocumentationValidator([rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(1);
    });
  });
});

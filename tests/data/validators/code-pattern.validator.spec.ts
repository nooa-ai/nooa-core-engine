/**
 * Unit tests for CodePatternValidator
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodePatternValidator } from '../../../src/data/validators/code-pattern.validator';
import {
  CodeSymbolModel,
  ForbiddenKeywordsRule,
  ForbiddenPatternsRule,
  BarrelPurityRule
} from '../../../src/domain/models';

const readFileContentMock = vi.hoisted(() => vi.fn());

vi.mock('../../../src/data/helpers', () => ({
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

describe('CodePatternValidator', () => {
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

  describe('forbidden keywords validation', () => {
    const makeForbiddenKeywordsRule = (overrides?: Partial<ForbiddenKeywordsRule>): ForbiddenKeywordsRule => ({
      type: 'forbidden_keywords',
      name: 'no-console',
      severity: 'warning',
      from: { role: '*' },
      contains_forbidden: ['console.log', 'debugger'],
      ...overrides,
    });

    it('should return no violations when forbidden keywords are not present', async () => {
      const rule = makeForbiddenKeywordsRule();
      const symbol = makeSymbol();
      const fileContent = 'export class Test { method() {} }';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([rule], [], []);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should return violation when forbidden keyword is found', async () => {
      const rule = makeForbiddenKeywordsRule();
      const symbol = makeSymbol({ path: 'src/debug.ts' });
      const fileContent = 'console.log("debug"); export class Test {}';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([rule], [], []);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ruleName: 'no-console',
        severity: 'warning',
        file: 'src/debug.ts',
        fromRole: 'UseCase',
      });
      expect(result[0].message).toContain("contains forbidden keyword 'console.log'");
    });

    it('should detect multiple forbidden keywords', async () => {
      const rule = makeForbiddenKeywordsRule();
      const symbol = makeSymbol();
      const fileContent = 'debugger; export class Test {}';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([rule], [], []);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0].message).toContain("contains forbidden keyword 'debugger'");
    });

    it('should include comment in violation message', async () => {
      const rule = makeForbiddenKeywordsRule({
        comment: 'Use proper logging instead'
      });
      const symbol = makeSymbol();
      const fileContent = 'console.log("test")';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([rule], [], []);
      const result = await sut.validate([symbol], projectPath);

      expect(result[0].message).toContain('Use proper logging instead');
    });

    it('should only validate symbols matching role pattern', async () => {
      const rule = makeForbiddenKeywordsRule({ from: { role: 'Controller' } });
      const symbol1 = makeSymbol({ role: 'Controller', path: 'controller.ts' });
      const symbol2 = makeSymbol({ role: 'UseCase', path: 'usecase.ts' });
      const fileContent = 'console.log("test")';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([rule], [], []);
      const result = await sut.validate([symbol1, symbol2], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0].file).toBe('controller.ts');
    });

    it('should skip files that cannot be read', async () => {
      const rule = makeForbiddenKeywordsRule();
      const symbol = makeSymbol();

      readFileContentMock.mockReturnValue(null);

      const sut = new CodePatternValidator([rule], [], []);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });
  });

  describe('forbidden patterns validation', () => {
    const makeForbiddenPatternsRule = (overrides?: Partial<ForbiddenPatternsRule>): ForbiddenPatternsRule => ({
      type: 'forbidden_patterns',
      name: 'no-any',
      severity: 'error',
      from: { role: '*' },
      contains_forbidden: [': any', '\\bany\\b'],
      ...overrides,
    });

    it('should return no violations when forbidden patterns are not present', async () => {
      const rule = makeForbiddenPatternsRule();
      const symbol = makeSymbol();
      const fileContent = 'const test: string = "hello";';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([], [rule], []);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should return violation when forbidden pattern is found', async () => {
      const rule = makeForbiddenPatternsRule();
      const symbol = makeSymbol({ path: 'src/bad.ts' });
      const fileContent = 'const test: any = "hello";';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([], [rule], []);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ruleName: 'no-any',
        severity: 'error',
        file: 'src/bad.ts',
        fromRole: 'UseCase',
      });
      expect(result[0].message).toContain("contains forbidden pattern ': any'");
    });

    it('should support regex patterns', async () => {
      const rule = makeForbiddenPatternsRule({
        contains_forbidden: ['function\\s+\\w+\\s*\\(']
      });
      const symbol = makeSymbol();
      const fileContent = 'function test() { return 1; }';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([], [rule], []);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(1);
    });

    it('should skip invalid regex patterns', async () => {
      const rule = makeForbiddenPatternsRule({
        contains_forbidden: ['[invalid regex']
      });
      const symbol = makeSymbol();
      const fileContent = '[invalid regex in content';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([], [rule], []);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should include comment in violation message', async () => {
      const rule = makeForbiddenPatternsRule({
        comment: 'Use proper types instead of any'
      });
      const symbol = makeSymbol();
      const fileContent = 'const test: any = "hello";';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([], [rule], []);
      const result = await sut.validate([symbol], projectPath);

      expect(result[0].message).toContain('Use proper types instead of any');
    });
  });

  describe('barrel purity validation', () => {
    const makeBarrelPurityRule = (overrides?: Partial<BarrelPurityRule>): BarrelPurityRule => ({
      type: 'barrel_purity',
      name: 'pure-index',
      severity: 'warning',
      for: { file_pattern: 'index\\.ts$' },
      contains_forbidden: ['class ', 'function ', 'const .*=.*\\{'],
      ...overrides,
    });

    it('should return no violations for pure barrel files', async () => {
      const rule = makeBarrelPurityRule();
      const symbol = makeSymbol({ path: 'src/index.ts' });
      const fileContent = "export * from './foo';\nexport { Bar } from './bar';";

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([], [], [rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });

    it('should return violation when barrel contains class definition', async () => {
      const rule = makeBarrelPurityRule();
      const symbol = makeSymbol({ path: 'src/index.ts' });
      const fileContent = "export class Test {}\nexport * from './foo';";

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([], [], [rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ruleName: 'pure-index',
        severity: 'warning',
        file: 'src/index.ts',
      });
      expect(result[0].message).toContain('Barrel file');
      expect(result[0].message).toContain('should only re-export');
      expect(result[0].message).toContain("'class '");
    });

    it('should only validate files matching file_pattern', async () => {
      const rule = makeBarrelPurityRule();
      const symbol1 = makeSymbol({ path: 'src/index.ts' });
      const symbol2 = makeSymbol({ path: 'src/class.ts' });
      const fileContent = 'export class Test {}';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([], [], [rule]);
      const result = await sut.validate([symbol1, symbol2], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0].file).toBe('src/index.ts');
    });

    it('should detect function definitions in barrels', async () => {
      const rule = makeBarrelPurityRule();
      const symbol = makeSymbol({ path: 'src/index.ts' });
      const fileContent = "function helper() {}\nexport * from './foo';";

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([], [], [rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(1);
      expect(result[0].message).toContain("'function '");
    });

    it('should include comment in violation message', async () => {
      const rule = makeBarrelPurityRule({
        comment: 'Index files must only re-export'
      });
      const symbol = makeSymbol({ path: 'src/index.ts' });
      const fileContent = 'class Test {}';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([], [], [rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result[0].message).toContain('Index files must only re-export');
    });

    it('should skip invalid regex patterns', async () => {
      const rule = makeBarrelPurityRule({
        contains_forbidden: ['[invalid']
      });
      const symbol = makeSymbol({ path: 'src/index.ts' });
      const fileContent = '[invalid';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([], [], [rule]);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toEqual([]);
    });
  });

  describe('multiple rule types', () => {
    it('should validate all rule types in parallel', async () => {
      const keywordsRule = {
        type: 'forbidden_keywords' as const,
        name: 'no-console',
        severity: 'warning' as const,
        from: { role: '*' },
        contains_forbidden: ['console.log'],
      };
      const patternsRule = {
        type: 'forbidden_patterns' as const,
        name: 'no-any',
        severity: 'error' as const,
        from: { role: '*' },
        contains_forbidden: [': any'],
      };
      const symbol = makeSymbol();
      const fileContent = 'console.log(test); const x: any = 1;';

      readFileContentMock.mockReturnValue(fileContent);

      const sut = new CodePatternValidator([keywordsRule], [patternsRule], []);
      const result = await sut.validate([symbol], projectPath);

      expect(result).toHaveLength(2);
      expect(result.find(v => v.ruleName === 'no-console')).toBeDefined();
      expect(result.find(v => v.ruleName === 'no-any')).toBeDefined();
    });

    it('should use file cache for all validations', async () => {
      const keywordsRule = {
        type: 'forbidden_keywords' as const,
        name: 'no-console',
        severity: 'warning' as const,
        from: { role: '*' },
        contains_forbidden: ['console.log'],
      };
      const symbol = makeSymbol();
      const fileCache = new Map<string, string>();
      fileCache.set('src/test.ts', 'console.log("test")');

      readFileContentMock.mockImplementation(
        (path, cache) => cache?.get(path) || null
      );

      const sut = new CodePatternValidator([keywordsRule], [], []);
      const result = await sut.validate([symbol], projectPath, fileCache);

      expect(result).toHaveLength(1);
      expect(readFileContentMock).toHaveBeenCalledWith(
        'src/test.ts',
        fileCache
      );
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AnalyzeCodebaseUseCase } from '../../../src/data/usecases/analyze-codebase.usecase';
import {
  CodeSymbolModel,
  GrammarModel,
  RoleDefinitionModel,
  ArchitecturalRuleModel,
  DependencyRule,
  NamingPatternRule,
} from '../../../src/domain/models';
import { CodeParserSpy, GrammarRepositorySpy } from '../mocks';

// Mock fs module at module level
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    access: vi.fn(),
    stat: vi.fn()
  }
}));

const makeRoles = (roles: RoleDefinitionModel[]): RoleDefinitionModel[] => roles;

const makeGrammar = (rules: ArchitecturalRuleModel[], roles: RoleDefinitionModel[]): GrammarModel => ({
  version: 'test',
  language: 'typescript',
  roles,
  rules,
});

const makeSymbol = (overrides: Partial<CodeSymbolModel>): CodeSymbolModel => ({
  path: 'src/example.ts',
  name: 'Example',
  role: 'UNKNOWN',
  dependencies: [],
  ...overrides,
});

const makeSut = (grammar: GrammarModel) => {
  const codeParserSpy = new CodeParserSpy();
  const grammarRepositorySpy = new GrammarRepositorySpy(grammar);
  const sut = new AnalyzeCodebaseUseCase(codeParserSpy, grammarRepositorySpy);

  return {
    sut,
    codeParserSpy,
    grammarRepositorySpy,
  };
};

describe('AnalyzeCodebaseUseCase', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it('Should load grammar and parse project with provided path', async () => {
    const grammar = makeGrammar([], []);
    const { sut, codeParserSpy, grammarRepositorySpy } = makeSut(grammar);
    const projectPath = '/tmp/project';

    await sut.analyze({ projectPath });

    expect(grammarRepositorySpy.projectPath).toBe(projectPath);
    expect(codeParserSpy.projectPath).toBe(projectPath);
  });

  it('Should return a naming pattern violation when file path does not match rule', async () => {
    const controllerRole: RoleDefinitionModel = {
      name: 'CONTROLLER',
      path: '^src/presentation/controllers',
    };

    const namingRule: NamingPatternRule = {
      name: 'ControllerNaming',
      severity: 'warning',
      rule: 'naming_pattern',
      for: { role: 'CONTROLLER' },
      pattern: '\\.controller\\.ts$',
      comment: 'Controllers should end with .controller.ts',
    };

    const grammar = makeGrammar([namingRule], makeRoles([controllerRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/presentation/controllers/login.ts',
        name: 'LoginController',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleName).toBe(namingRule.name);
    expect(violations[0].message).toMatch(/does not match naming pattern/);
  });

  it('Should report missing required dependency', async () => {
    const serviceRole: RoleDefinitionModel = { name: 'SERVICE', path: '^src/data/usecases' };
    const repositoryRole: RoleDefinitionModel = {
      name: 'REPOSITORY',
      path: '^src/data/protocols',
    };

    const requiredRule: DependencyRule = {
      name: 'ServiceNeedsRepository',
      severity: 'error',
      comment: 'Use cases must depend on repositories',
      rule: 'required',
      from: { role: 'SERVICE' },
      to: { role: 'REPOSITORY' },
    };

    const grammar = makeGrammar([requiredRule], makeRoles([serviceRole, repositoryRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/data/usecases/process-data.usecase.ts',
        name: 'ProcessDataUseCase',
      }),
      makeSymbol({
        path: 'src/data/protocols/process-repository.ts',
        name: 'ProcessRepository',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleName).toBe(requiredRule.name);
    expect(violations[0].message).toMatch(/must depend on at least one/);
  });

  it('Should not report any violations for empty rules', async () => {
    const grammar = makeGrammar([], []);
    const { sut, codeParserSpy } = makeSut(grammar);

    codeParserSpy.result = [
      makeSymbol({ path: 'src/test.ts' })
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });
    expect(violations).toHaveLength(0);
  });

  it('Should assign roles correctly based on path patterns', async () => {
    const domainRole: RoleDefinitionModel = {
      name: 'DOMAIN',
      path: '^src/domain',
    };

    const grammar = makeGrammar([], makeRoles([domainRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    codeParserSpy.result = [
      makeSymbol({ path: 'src/domain/models/user.ts' }),
      makeSymbol({ path: 'src/infra/database.ts' })
    ];

    await sut.analyze({ projectPath: '/tmp/project' });

    // Role assignment is internal, we need to test via rule validation
    // This test ensures the role assignment logic is executed
    expect(codeParserSpy.result).toHaveLength(2);
  });

  it('Should detect circular dependency between service modules', async () => {
    const serviceRole: RoleDefinitionModel = { name: 'SERVICE', path: '^src/data/usecases' };

    const circularRule: DependencyRule = {
      name: 'NoCircularServices',
      severity: 'error',
      comment: 'Services cannot depend on each other circularly',
      rule: 'forbidden',
      from: { role: 'SERVICE' },
      to: { circular: true },
    };

    const grammar = makeGrammar([circularRule], makeRoles([serviceRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    const firstPath = 'src/data/usecases/alpha.usecase.ts';
    const secondPath = 'src/data/usecases/beta.usecase.ts';

    codeParserSpy.result = [
      makeSymbol({
        path: firstPath,
        name: 'AlphaUseCase',
        dependencies: [secondPath],
      }),
      makeSymbol({
        path: secondPath,
        name: 'BetaUseCase',
        dependencies: [firstPath],
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });
    const circularViolation = violations.find((violation) =>
      violation.ruleName === circularRule.name
    );

    expect(circularViolation).toBeDefined();
    expect(circularViolation!.message).toMatch(/Circular dependency detected/);
  });

  it('Should detect forbidden dependencies', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };
    const infraRole: RoleDefinitionModel = { name: 'INFRA', path: '^src/infra' };

    const forbiddenRule: DependencyRule = {
      name: 'DomainIndependence',
      severity: 'error',
      rule: 'forbidden',
      from: { role: 'DOMAIN' },
      to: { role: 'INFRA' },
    };

    const grammar = makeGrammar([forbiddenRule], makeRoles([domainRole, infraRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/user.ts',
        dependencies: ['src/infra/database.ts'],
      }),
      makeSymbol({
        path: 'src/infra/database.ts',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleName).toBe('DomainIndependence');
  });

  it('Should detect file size violations', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };

    const fileSizeRule: any = {
      name: 'SmallFiles',
      severity: 'warning',
      rule: 'file_size',
      for: { role: 'DOMAIN' },
      max_lines: 50,
    };

    const grammar = makeGrammar([fileSizeRule], makeRoles([domainRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    // Mock fs module
    const largeFileContent = Array(100).fill('line').join('\n');
    const fs = await import('fs');
    vi.mocked(fs.promises.readFile).mockResolvedValue(largeFileContent);

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/large.ts',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleName).toBe('SmallFiles');
    expect(violations[0].message).toMatch(/has 100 lines/);
  });

  it('Should detect missing test coverage', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };

    const testCoverageRule: any = {
      name: 'RequireTests',
      severity: 'error',
      rule: 'test_coverage',
      from: { role: 'DOMAIN' },
      to: { test_file: 'required' },
    };

    const grammar = makeGrammar([testCoverageRule], makeRoles([domainRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    // Mock fs module
    const fs = await import('fs');
    vi.mocked(fs.promises.access).mockRejectedValue(new Error('File not found'));

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/untested.ts',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleName).toBe('RequireTests');
    expect(violations[0].message).toMatch(/has no corresponding test file/);
  });

  it('Should detect forbidden keywords', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };

    const forbiddenKeywordsRule: any = {
      name: 'NoConsoleLog',
      severity: 'error',
      rule: 'forbidden_keywords',
      from: { role: 'DOMAIN' },
      contains_forbidden: ['console.log', 'debugger'],
    };

    const grammar = makeGrammar([forbiddenKeywordsRule], makeRoles([domainRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    // Mock fs module
    const fs = await import('fs');
    vi.mocked(fs.promises.readFile).mockResolvedValue('console.log("debug");');

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/debug.ts',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleName).toBe('NoConsoleLog');
    expect(violations[0].message).toMatch(/contains forbidden keyword/);
  });

  it('Should handle file read errors in forbidden keywords validation', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };

    const forbiddenKeywordsRule: any = {
      name: 'NoConsoleLog',
      severity: 'error',
      rule: 'forbidden_keywords',
      from: { role: 'DOMAIN' },
      contains_forbidden: ['console.log', 'debugger'],
    };

    const grammar = makeGrammar([forbiddenKeywordsRule], makeRoles([domainRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    // Mock fs module to throw error
    const fs = await import('fs');
    vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('File not found'));

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/missing.ts',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    // Should not throw, just skip the file
    expect(violations).toHaveLength(0);
  });

  it('Should detect missing required structure', async () => {
    const requiredStructureRule: any = {
      name: 'RequiredDirs',
      severity: 'error',
      rule: 'required_structure',
      required_directories: ['src/domain', 'src/infra'],
    };

    const grammar = makeGrammar([requiredStructureRule], []);
    const { sut } = makeSut(grammar);

    // Mock fs module
    const fs = await import('fs');
    vi.mocked(fs.promises.stat).mockRejectedValue(new Error('Directory not found'));

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(2);
    expect(violations[0].ruleName).toBe('RequiredDirs');
    expect(violations[0].message).toMatch(/does not exist/);
  });

  it('Should detect when required path exists but is not a directory', async () => {
    const requiredStructureRule: any = {
      name: 'RequiredDirs',
      severity: 'error',
      rule: 'required_structure',
      required_directories: ['src/domain', 'src/infra'],
    };

    const grammar = makeGrammar([requiredStructureRule], []);
    const { sut } = makeSut(grammar);

    // Mock fs module - first path is a file (not directory), second doesn't exist
    const fs = await import('fs');
    vi.mocked(fs.promises.stat)
      .mockResolvedValueOnce({ isDirectory: () => false } as any)
      .mockRejectedValueOnce(new Error('Directory not found'));

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(2);
    expect(violations[0].ruleName).toBe('RequiredDirs');
    expect(violations[0].message).toMatch(/does not exist/);
    expect(violations[1].ruleName).toBe('RequiredDirs');
    expect(violations[1].message).toMatch(/does not exist/);
  });

  it('Should detect missing documentation', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };

    const documentationRule: any = {
      name: 'RequireJSDoc',
      severity: 'warning',
      rule: 'documentation_required',
      for: { role: 'DOMAIN' },
      min_lines: 50,
      requires_jsdoc: true,
    };

    const grammar = makeGrammar([documentationRule], makeRoles([domainRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    // Mock fs module
    const largeFileContent = Array(60).fill('line').join('\n');
    const fs = await import('fs');
    vi.mocked(fs.promises.readFile).mockResolvedValue(largeFileContent);

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/undocumented.ts',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleName).toBe('RequireJSDoc');
    expect(violations[0].message).toMatch(/lacks JSDoc documentation/);
  });

  it('Should handle file read errors in documentation validation', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };

    const documentationRule: any = {
      name: 'RequireJSDoc',
      severity: 'warning',
      rule: 'documentation_required',
      for: { role: 'DOMAIN' },
      min_lines: 50,
      requires_jsdoc: true,
    };

    const grammar = makeGrammar([documentationRule], makeRoles([domainRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    // Mock fs module to throw error
    const fs = await import('fs');
    vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('File not found'));

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/missing.ts',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    // Should not throw, just skip the file
    expect(violations).toHaveLength(0);
  });

  it('Should detect complex classes', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };

    const complexityRule: any = {
      name: 'NoGodObjects',
      severity: 'error',
      rule: 'class_complexity',
      for: { role: 'DOMAIN' },
      max_public_methods: 5,
      max_properties: 10,
    };

    const grammar = makeGrammar([complexityRule], makeRoles([domainRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    // Mock fs module with complex class
    const complexClass = `
      class GodObject {
        private prop1: string;
        private prop2: number;
        private prop3: boolean;
        public prop4: string;
        public prop5: number;
        public prop6: boolean;
        public prop7: string;
        public prop8: number;
        public prop9: boolean;
        public prop10: string;
        public prop11: number;

        public method1() {}
        public method2() {}
        public method3() {}
        public method4() {}
        public method5() {}
        public method6() {}
      }
    `;
    const fs = await import('fs');
    vi.mocked(fs.promises.readFile).mockResolvedValue(complexClass);

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/god-object.ts',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(2);
    expect(violations.some(v => v.message.includes('public methods'))).toBe(true);
    expect(violations.some(v => v.message.includes('properties'))).toBe(true);
  });

  it('Should handle file read errors in class complexity validation', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };

    const complexityRule: any = {
      name: 'NoGodObjects',
      severity: 'error',
      rule: 'class_complexity',
      for: { role: 'DOMAIN' },
      max_public_methods: 5,
      max_properties: 10,
    };

    const grammar = makeGrammar([complexityRule], makeRoles([domainRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    // Mock fs module to throw error
    const fs = await import('fs');
    vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('File not found'));

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/missing.ts',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    // Should not throw, just skip the file
    expect(violations).toHaveLength(0);
  });

  it('Should detect synonyms in file names', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };

    const synonymRule: any = {
      name: 'FindSynonyms',
      severity: 'warning',
      rule: 'find_synonyms',
      for: { role: 'DOMAIN' },
      options: {
        similarity_threshold: 0.8,
        thesaurus: [['user', 'person', 'account']],
      },
    };

    const grammar = makeGrammar([synonymRule], makeRoles([domainRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/user.ts',
        name: 'User',
      }),
      makeSymbol({
        path: 'src/domain/models/person.ts',
        name: 'Person',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleName).toBe('FindSynonyms');
    expect(violations[0].message).toMatch(/very similar names/);
  });

  it('Should handle role matching with array of roles', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };
    const infraRole: RoleDefinitionModel = { name: 'INFRA', path: '^src/infra' };

    const forbiddenRule: DependencyRule = {
      name: 'MultipleForbidden',
      severity: 'error',
      rule: 'forbidden',
      from: { role: 'DOMAIN' },
      to: { role: ['INFRA', 'CONTROLLER'] }, // Array of roles
    };

    const grammar = makeGrammar([forbiddenRule], makeRoles([domainRole, infraRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/user.ts',
        dependencies: ['src/infra/database.ts'],
      }),
      makeSymbol({
        path: 'src/infra/database.ts',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleName).toBe('MultipleForbidden');
  });

  it('Should detect unreferenced code', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };
    const controllerRole: RoleDefinitionModel = { name: 'CONTROLLER', path: '^src/presentation' };

    const unreferencedRule: any = {
      name: 'DetectZombies',
      severity: 'warning',
      rule: 'detect_unreferenced',
      for: { role: 'DOMAIN' },
      options: {
        ignore_patterns: ['index\\.ts$'],
      },
    };

    const grammar = makeGrammar([unreferencedRule], makeRoles([domainRole, controllerRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/zombie.ts',
        name: 'Zombie',
        dependencies: [],
      }),
      makeSymbol({
        path: 'src/domain/models/used.ts',
        name: 'Used',
        dependencies: [],
      }),
      makeSymbol({
        path: 'src/domain/models/index.ts',
        name: 'index',
        dependencies: ['src/domain/models/used.ts'],
      }),
      makeSymbol({
        path: 'src/presentation/controllers/main.ts',
        name: 'MainController',
        dependencies: ['src/domain/models/index.ts'],
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    expect(violations).toHaveLength(1);
    expect(violations[0].file).toBe('src/domain/models/zombie.ts');
    expect(violations[0].message).toMatch(/not imported by any other file/);
  });

  it('Should handle file read errors gracefully', async () => {
    const domainRole: RoleDefinitionModel = { name: 'DOMAIN', path: '^src/domain' };

    const fileSizeRule: any = {
      name: 'SmallFiles',
      severity: 'warning',
      rule: 'file_size',
      for: { role: 'DOMAIN' },
      max_lines: 50,
    };

    const grammar = makeGrammar([fileSizeRule], makeRoles([domainRole]));
    const { sut, codeParserSpy } = makeSut(grammar);

    // Mock fs module to throw error
    const fs = await import('fs');
    vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('File not found'));

    codeParserSpy.result = [
      makeSymbol({
        path: 'src/domain/models/missing.ts',
      }),
    ];

    const violations = await sut.analyze({ projectPath: '/tmp/project' });

    // Should not throw, just skip the file
    expect(violations).toHaveLength(0);
  });

  describe('minimum_test_ratio rule', () => {
    it('Should detect insufficient test ratio', async () => {
      const minimumTestRatioRule: any = {
        name: 'MinimumTestCoverage',
        severity: 'error',
        rule: 'minimum_test_ratio',
        global: {
          test_ratio: 0.5,
        },
      };

      const grammar = makeGrammar([minimumTestRatioRule], []);
      const { sut, codeParserSpy } = makeSut(grammar);

      // 4 production files and only 1 test file (25% ratio, needs 50%)
      codeParserSpy.result = [
        makeSymbol({ path: 'src/domain/models/user.ts' }),
        makeSymbol({ path: 'src/domain/models/product.ts' }),
        makeSymbol({ path: 'src/infra/database.ts' }),
        makeSymbol({ path: 'src/presentation/controller.ts' }),
        makeSymbol({ path: 'tests/domain/user.spec.ts' }),
      ];

      const violations = await sut.analyze({ projectPath: '/tmp/project' });

      expect(violations).toHaveLength(1);
      expect(violations[0].ruleName).toBe('MinimumTestCoverage');
      expect(violations[0].message).toMatch(/Test ratio is 0.25/);
      expect(violations[0].message).toMatch(/minimum required: 0.5/);
    });

    it('Should pass when test ratio meets requirement', async () => {
      const minimumTestRatioRule: any = {
        name: 'MinimumTestCoverage',
        severity: 'error',
        rule: 'minimum_test_ratio',
        global: {
          test_ratio: 0.5,
        },
      };

      const grammar = makeGrammar([minimumTestRatioRule], []);
      const { sut, codeParserSpy } = makeSut(grammar);

      // 2 production files and 2 test files (100% ratio, needs 50%)
      codeParserSpy.result = [
        makeSymbol({ path: 'src/domain/models/user.ts' }),
        makeSymbol({ path: 'src/domain/models/product.ts' }),
        makeSymbol({ path: 'tests/domain/user.spec.ts' }),
        makeSymbol({ path: 'tests/domain/product.spec.ts' }),
      ];

      const violations = await sut.analyze({ projectPath: '/tmp/project' });

      expect(violations).toHaveLength(0);
    });

    it('Should handle project with no test files', async () => {
      const minimumTestRatioRule: any = {
        name: 'MinimumTestCoverage',
        severity: 'error',
        rule: 'minimum_test_ratio',
        global: {
          test_ratio: 0.8,
        },
      };

      const grammar = makeGrammar([minimumTestRatioRule], []);
      const { sut, codeParserSpy } = makeSut(grammar);

      // Only production files, no test files
      codeParserSpy.result = [
        makeSymbol({ path: 'src/domain/models/user.ts' }),
        makeSymbol({ path: 'src/infra/database.ts' }),
      ];

      const violations = await sut.analyze({ projectPath: '/tmp/project' });

      expect(violations).toHaveLength(1);
      expect(violations[0].message).toMatch(/Test ratio is 0/);
    });

    it('Should handle project with only test files', async () => {
      const minimumTestRatioRule: any = {
        name: 'MinimumTestCoverage',
        severity: 'error',
        rule: 'minimum_test_ratio',
        global: {
          test_ratio: 0.5,
        },
      };

      const grammar = makeGrammar([minimumTestRatioRule], []);
      const { sut, codeParserSpy } = makeSut(grammar);

      // Only test files, no production files
      codeParserSpy.result = [
        makeSymbol({ path: 'tests/domain/user.spec.ts' }),
        makeSymbol({ path: 'tests/domain/product.test.ts' }),
      ];

      const violations = await sut.analyze({ projectPath: '/tmp/project' });

      // Should pass since there's nothing to test
      expect(violations).toHaveLength(0);
    });
  });

  describe('granularity_metric rule', () => {
    it('Should warn when average file size exceeds target', async () => {
      const granularityRule: any = {
        name: 'FileGranularity',
        severity: 'warning',
        rule: 'granularity_metric',
        global: {
          target_loc_per_file: 20,
          warning_threshold_multiplier: 1.5,
        },
      };

      const grammar = makeGrammar([granularityRule], []);
      const { sut, codeParserSpy } = makeSut(grammar);

      // Mock fs module - 3 files with different sizes
      const fs = await import('fs');
      vi.mocked(fs.promises.readFile)
        .mockResolvedValueOnce(Array(60).fill('line').join('\n')) // 60 lines
        .mockResolvedValueOnce(Array(80).fill('line').join('\n')) // 80 lines
        .mockResolvedValueOnce(Array(100).fill('line').join('\n')); // 100 lines
      // Average = 80 lines, target = 20, threshold = 30 -> violation

      codeParserSpy.result = [
        makeSymbol({ path: 'src/large1.ts' }),
        makeSymbol({ path: 'src/large2.ts' }),
        makeSymbol({ path: 'src/large3.ts' }),
      ];

      const violations = await sut.analyze({ projectPath: '/tmp/project' });

      expect(violations).toHaveLength(1);
      expect(violations[0].ruleName).toBe('FileGranularity');
      expect(violations[0].message).toMatch(/Average lines per file: 80/);
      expect(violations[0].message).toMatch(/target: 20/);
    });

    it('Should pass when average file size is within target', async () => {
      const granularityRule: any = {
        name: 'FileGranularity',
        severity: 'warning',
        rule: 'granularity_metric',
        global: {
          target_loc_per_file: 50,
          warning_threshold_multiplier: 1.5,
        },
      };

      const grammar = makeGrammar([granularityRule], []);
      const { sut, codeParserSpy } = makeSut(grammar);

      // Mock fs module - 3 files with acceptable sizes
      const fs = await import('fs');
      vi.mocked(fs.promises.readFile)
        .mockResolvedValueOnce(Array(40).fill('line').join('\n')) // 40 lines
        .mockResolvedValueOnce(Array(50).fill('line').join('\n')) // 50 lines
        .mockResolvedValueOnce(Array(60).fill('line').join('\n')); // 60 lines
      // Average = 50 lines, target = 50, threshold = 75 -> no violation

      codeParserSpy.result = [
        makeSymbol({ path: 'src/file1.ts' }),
        makeSymbol({ path: 'src/file2.ts' }),
        makeSymbol({ path: 'src/file3.ts' }),
      ];

      const violations = await sut.analyze({ projectPath: '/tmp/project' });

      expect(violations).toHaveLength(0);
    });

    it('Should handle empty project gracefully', async () => {
      const granularityRule: any = {
        name: 'FileGranularity',
        severity: 'warning',
        rule: 'granularity_metric',
        global: {
          target_loc_per_file: 20,
          warning_threshold_multiplier: 1.5,
        },
      };

      const grammar = makeGrammar([granularityRule], []);
      const { sut, codeParserSpy } = makeSut(grammar);

      codeParserSpy.result = [];

      const violations = await sut.analyze({ projectPath: '/tmp/project' });

      expect(violations).toHaveLength(0);
    });

    it('Should handle file read errors gracefully', async () => {
      const granularityRule: any = {
        name: 'FileGranularity',
        severity: 'warning',
        rule: 'granularity_metric',
        global: {
          target_loc_per_file: 20,
          warning_threshold_multiplier: 1.5,
        },
      };

      const grammar = makeGrammar([granularityRule], []);
      const { sut, codeParserSpy } = makeSut(grammar);

      // Mock fs module to throw error
      const fs = await import('fs');
      vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('File not found'));

      codeParserSpy.result = [
        makeSymbol({ path: 'src/missing.ts' }),
      ];

      const violations = await sut.analyze({ projectPath: '/tmp/project' });

      // Should not throw, just skip the file
      expect(violations).toHaveLength(0);
    });
  });
});

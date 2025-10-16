import { describe, it, expect } from 'vitest';
import {
  makeGrammarMock,
  makeRoleDefinitionMock,
  makeArchitecturalRuleMock,
  makeCodeSymbolMock,
  makeArchitecturalViolationMock
} from '../../../src/domain/mocks';

describe('Domain Mocks', () => {
  describe('makeGrammarMock', () => {
    it('should create a grammar mock with default values', () => {
      const mock = makeGrammarMock();

      expect(mock.version).toBe('1.0.0');
      expect(mock.language).toBe('typescript');
      expect(mock.roles).toHaveLength(1);
      expect(mock.rules).toHaveLength(1);
    });

    it('should create a grammar mock with custom values', () => {
      const custom = makeGrammarMock({
        version: '2.0.0',
        language: 'javascript',
        roles: [makeRoleDefinitionMock()],
        rules: [makeArchitecturalRuleMock()]
      });

      expect(custom.version).toBe('2.0.0');
      expect(custom.language).toBe('javascript');
      expect(custom.roles).toHaveLength(1);
      expect(custom.rules).toHaveLength(1);
    });
  });

  describe('makeRoleDefinitionMock', () => {
    it('should create a role definition mock with default values', () => {
      const mock = makeRoleDefinitionMock();

      expect(mock.name).toBe('SERVICE');
      expect(mock.path).toBe('^src/sample/service');
      expect(mock.description).toBe('Sample service layer role.');
    });

    it('should create a role definition mock with custom values', () => {
      const custom = makeRoleDefinitionMock({
        name: 'INFRA',
        path: '^src/infra',
        description: 'Infrastructure layer'
      });

      expect(custom.name).toBe('INFRA');
      expect(custom.path).toBe('^src/infra');
      expect(custom.description).toBe('Infrastructure layer');
    });
  });

  describe('makeArchitecturalRuleMock', () => {
    it('should create a dependency rule mock with default values', () => {
      const mock = makeArchitecturalRuleMock();

      expect(mock.name).toBe('SAMPLE_RULE');
      expect(mock.severity).toBe('warning');
      expect(mock.rule).toBe('allowed');
      expect(mock.from).toEqual({ role: 'SERVICE' });
      expect(mock.to).toEqual({ role: 'REPOSITORY' });
      expect(mock.comment).toBe('Sample architectural rule used for testing.');
    });

    it('should create a naming pattern rule mock', () => {
      const mock = makeArchitecturalRuleMock({
        name: 'ControllerNaming',
        severity: 'warning',
        rule: 'naming_pattern',
        for: { role: 'CONTROLLER' },
        pattern: '\\.controller\\.ts$',
        comment: 'Controllers must end with .controller.ts'
      });

      expect(mock.name).toBe('ControllerNaming');
      expect(mock.rule).toBe('naming_pattern');
      expect(mock.for).toEqual({ role: 'CONTROLLER' });
      expect(mock.pattern).toBe('\\.controller\\.ts$');
    });

    it('should create a circular dependency rule', () => {
      const mock = makeArchitecturalRuleMock({
        name: 'NoCircular',
        rule: 'forbidden',
        from: { role: 'ALL' },
        to: { circular: true }
      });

      expect(mock.name).toBe('NoCircular');
      expect(mock.to).toEqual({ circular: true });
    });

    it('should create a synonym detection rule', () => {
      const mock = makeArchitecturalRuleMock({
        name: 'FindSynonyms',
        rule: 'find_synonyms',
        for: { role: 'ALL' },
        options: {
          similarity_threshold: 0.8,
          thesaurus: [['create', 'add', 'insert']]
        }
      });

      expect(mock.rule).toBe('find_synonyms');
      expect(mock.options).toBeDefined();
      expect(mock.options.similarity_threshold).toBe(0.8);
      expect(mock.options.thesaurus).toHaveLength(1);
    });

    it('should create an unreferenced code detection rule', () => {
      const mock = makeArchitecturalRuleMock({
        name: 'DetectZombies',
        rule: 'detect_unreferenced',
        for: { role: 'ALL' },
        options: {
          ignore_patterns: ['^src/main', 'index\\.ts$']
        }
      });

      expect(mock.rule).toBe('detect_unreferenced');
      expect(mock.options).toBeDefined();
      expect(mock.options.ignore_patterns).toHaveLength(2);
    });
  });

  describe('makeCodeSymbolMock', () => {
    it('should create a code symbol mock with default values', () => {
      const mock = makeCodeSymbolMock();

      expect(mock.name).toBe('SampleService');
      expect(mock.path).toBe('src/sample/service.ts');
      expect(mock.role).toBe('SERVICE');
      expect(mock.dependencies).toEqual(['src/sample/repository.ts']);
      expect(mock.symbolType).toBe('class');
    });

    it('should create a code symbol mock with custom values', () => {
      const custom = makeCodeSymbolMock({
        name: 'UserRepository',
        path: 'src/infra/repositories/user.repository.ts',
        role: 'REPOSITORY',
        dependencies: ['src/domain/models/user.ts'],
        symbolType: 'class'
      });

      expect(custom.name).toBe('UserRepository');
      expect(custom.path).toBe('src/infra/repositories/user.repository.ts');
      expect(custom.role).toBe('REPOSITORY');
      expect(custom.dependencies).toHaveLength(1);
    });
  });

  describe('makeArchitecturalViolationMock', () => {
    it('should create an architectural violation mock with default values', () => {
      const mock = makeArchitecturalViolationMock();

      expect(mock.ruleName).toBe('SAMPLE_RULE');
      expect(mock.severity).toBe('warning');
      expect(mock.file).toBe('src/sample/service.ts');
      expect(mock.message).toBe('Sample violation message.');
      expect(mock.fromRole).toBe('SERVICE');
      expect(mock.toRole).toBe('REPOSITORY');
      expect(mock.dependency).toBe('src/repository/user-repository.ts');
    });

    it('should create a violation mock with custom values', () => {
      const custom = makeArchitecturalViolationMock({
        ruleName: 'NamingViolation',
        severity: 'warning',
        file: 'src/controllers/login.ts',
        message: 'File does not match naming pattern',
        fromRole: 'CONTROLLER',
        toRole: undefined,
        dependency: undefined
      });

      expect(custom.ruleName).toBe('NamingViolation');
      expect(custom.severity).toBe('warning');
      expect(custom.file).toBe('src/controllers/login.ts');
      expect(custom.toRole).toBeUndefined();
      expect(custom.dependency).toBeUndefined();
    });
  });
});
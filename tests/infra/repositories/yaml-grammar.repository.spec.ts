import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as yaml from 'yaml';
import { YamlGrammarRepository } from '../../../src/infra/repositories/yaml-grammar.repository';
import { IFileReader, IFileExistenceChecker } from '../../../src/data/protocols';
import { SchemaValidator } from '../../../src/infra/validators/schema.validator';

vi.mock('yaml');

describe('YamlGrammarRepository', () => {
  let sut: YamlGrammarRepository;
  let fileSystemMock: IFileReader & IFileExistenceChecker;
  let schemaValidatorMock: SchemaValidator;

  beforeEach(() => {
    // Create mock IFileReader & IFileExistenceChecker
    fileSystemMock = {
      readFileSync: vi.fn(),
      existsSync: vi.fn(),
    };

    // Create mock SchemaValidator
    schemaValidatorMock = {
      loadSchema: vi.fn(),
      validate: vi.fn().mockReturnValue({ valid: true, errors: [] }),
    } as any;

    sut = new YamlGrammarRepository(fileSystemMock, schemaValidatorMock);
    vi.clearAllMocks();
  });

  describe('load', () => {
    it('should load and parse nooa.grammar.yaml file', async () => {
      const mockGrammarContent = `
version: '1.0'
language: typescript
roles:
  - name: DOMAIN
    path: ^src/domain
    description: Domain layer
  - name: INFRA
    path: ^src/infra
    description: Infrastructure layer
rules:
  - name: TestRule
    severity: error
    from:
      role: DOMAIN
    to:
      role: INFRA
    rule: forbidden
`;

      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue(mockGrammarContent);
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [
          {
            name: 'DOMAIN',
            path: '^src/domain',
            description: 'Domain layer'
          },
          {
            name: 'INFRA',
            path: '^src/infra',
            description: 'Infrastructure layer'
          }
        ],
        rules: [
          {
            name: 'TestRule',
            severity: 'error',
            from: { role: 'DOMAIN' },
            to: { role: 'INFRA' },
            rule: 'forbidden'
          }
        ]
      });

      const result = await sut.load('/test/project');

      expect(fileSystemMock.existsSync).toHaveBeenCalledWith('/test/project/nooa.grammar.yaml');
      expect(fileSystemMock.readFileSync).toHaveBeenCalledWith('/test/project/nooa.grammar.yaml', 'utf-8');
      expect(result.version).toBe('1.0');
      expect(result.language).toBe('typescript');
      expect(result.roles).toHaveLength(2);
      expect(result.rules).toHaveLength(1);
    });

    it('should try .yml extension if .yaml not found', async () => {
      vi.mocked(fileSystemMock.existsSync)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('version: "1.0"\nlanguage: typescript\nroles: [{name: "TEST", path: "^src"}]\nrules: [{name: "R1", severity: "error", rule: "forbidden", from: {role: "TEST"}, to: {role: "TEST"}}]');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{ name: 'R1', severity: 'error', rule: 'forbidden', from: { role: 'TEST' }, to: { role: 'TEST' } }]
      });

      await sut.load('/test/project');

      expect(fileSystemMock.existsSync).toHaveBeenCalledTimes(2);
      expect(fileSystemMock.existsSync).toHaveBeenNthCalledWith(1, '/test/project/nooa.grammar.yaml');
      expect(fileSystemMock.existsSync).toHaveBeenNthCalledWith(2, '/test/project/nooa.grammar.yml');
    });

    it('should throw error if no grammar file found', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(false);

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Grammar file not found. Expected 'nooa.grammar.yaml' or 'nooa.grammar.yml'"
      );
    });

    it('should throw error if YAML parsing fails', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('invalid: yaml: content:');
      vi.mocked(yaml.parse).mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        'Failed to parse grammar file: Invalid YAML'
      );
    });

    it('should throw error if version is missing', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('language: typescript\nroles: [{name: "TEST", path: "^src"}]\nrules: [{name: "R1", severity: "error", rule: "forbidden", from: {role: "TEST"}, to: {role: "TEST"}}]');
      vi.mocked(yaml.parse).mockReturnValue({
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{ name: 'R1', severity: 'error', rule: 'forbidden', from: { role: 'TEST' }, to: { role: 'TEST' } }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'version'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'version'"
      );
    });

    it('should throw error if language is missing', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('version: "1.0"\nroles: [{name: "TEST", path: "^src"}]\nrules: [{name: "R1", severity: "error", rule: "forbidden", from: {role: "TEST"}, to: {role: "TEST"}}]');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{ name: 'R1', severity: 'error', rule: 'forbidden', from: { role: 'TEST' }, to: { role: 'TEST' } }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'language'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'language'"
      );
    });

    it('should throw error if roles is not an array', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('version: "1.0"\nlanguage: typescript\nroles: "invalid"\nrules: [{name: "R1", severity: "error", rule: "forbidden", from: {role: "TEST"}, to: {role: "TEST"}}]');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: 'invalid',
        rules: [{ name: 'R1', severity: 'error', rule: 'forbidden', from: { role: 'TEST' }, to: { role: 'TEST' } }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["/roles: must be array"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "/roles: must be array"
      );
    });

    it('should throw error if rules is not an array', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('version: "1.0"\nlanguage: typescript\nroles: [{name: "TEST", path: "^src"}]\nrules: "invalid"');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: 'invalid'
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["/rules: must be array"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "/rules: must be array"
      );
    });

    it('should validate role with missing name', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ path: '^src/domain' }],
        rules: [{ name: 'R1', severity: 'error', rule: 'forbidden', from: { role: 'TEST' }, to: { role: 'TEST' } }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'name'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'name'"
      );
    });

    it('should validate role with missing path', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'DOMAIN' }],
        rules: [{ name: 'R1', severity: 'error', rule: 'forbidden', from: { role: 'DOMAIN' }, to: { role: 'DOMAIN' } }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'path'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'path'"
      );
    });

    it('should validate rule with missing name', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{ severity: 'error', rule: 'forbidden' }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'name'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'name'"
      );
    });

    it('should validate rule with invalid severity', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{ name: 'TestRule', severity: 'critical', rule: 'forbidden' }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["/rules/0/severity: must be equal to one of the allowed values"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "/rules/0/severity: must be equal to one of the allowed values"
      );
    });

    it('should validate naming_pattern rule', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'DOMAIN', path: '^src/domain' }],
        rules: [{
          name: 'NamingRule',
          severity: 'warning',
          rule: 'naming_pattern',
          for: { role: 'DOMAIN' },
          pattern: '\\.ts$'
        }]
      });

      const result = await sut.load('/test/project');
      expect(result.rules[0]).toHaveProperty('pattern');
    });

    it('should validate naming_pattern rule without pattern', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'DOMAIN', path: '^src/domain' }],
        rules: [{
          name: 'NamingRule',
          severity: 'warning',
          rule: 'naming_pattern',
          for: { role: 'DOMAIN' }
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'pattern'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'pattern'"
      );
    });

    it('should validate naming_pattern rule with invalid regex', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'DOMAIN', path: '^src/domain' }],
        rules: [{
          name: 'NamingRule',
          severity: 'warning',
          rule: 'naming_pattern',
          for: { role: 'DOMAIN' },
          pattern: '[invalid'
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "'[invalid' is not a valid regular expression"
      );
    });

    it('should validate find_synonyms rule', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'DOMAIN', path: '^src/domain' }],
        rules: [{
          name: 'SynonymRule',
          severity: 'warning',
          rule: 'find_synonyms',
          for: { role: 'DOMAIN' },
          options: {
            similarity_threshold: 0.8,
            thesaurus: [['create', 'add']]
          }
        }]
      });

      const result = await sut.load('/test/project');
      expect(result.rules[0]).toHaveProperty('options');
    });

    it('should validate detect_unreferenced rule', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'ZombieRule',
          severity: 'info',
          rule: 'detect_unreferenced',
          for: { role: 'ALL' },
          options: {
            ignore_patterns: ['^src/main']
          }
        }]
      });

      const result = await sut.load('/test/project');
      expect(result.rules[0]).toHaveProperty('options');
    });

    it('should validate file_size rule', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'SizeRule',
          severity: 'error',
          rule: 'file_size',
          for: { role: 'ALL' },
          max_lines: 100
        }]
      });

      const result = await sut.load('/test/project');
      expect(result.rules[0]).toHaveProperty('max_lines', 100);
    });

    it('should validate test_coverage rule', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'PROD', path: '^src' }],
        rules: [{
          name: 'TestRule',
          severity: 'error',
          rule: 'test_coverage',
          from: { role: 'PROD' },
          to: { test_file: 'required' }
        }]
      });

      const result = await sut.load('/test/project');
      expect(result.rules[0]).toHaveProperty('to');
    });

    it('should throw error for test_coverage rule without from.role', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'PROD', path: '^src' }],
        rules: [{
          name: 'TestRule',
          severity: 'error',
          rule: 'test_coverage',
          to: { test_file: 'required' }
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'from'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'from'"
      );
    });

    it('should throw error for test_coverage rule without to.test_file', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'PROD', path: '^src' }],
        rules: [{
          name: 'TestRule',
          severity: 'error',
          rule: 'test_coverage',
          from: { role: 'PROD' },
          to: {}
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'test_file'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'test_file'"
      );
    });

    it('should validate forbidden_keywords rule', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'CONTROLLER', path: '^src/controllers' }],
        rules: [{
          name: 'KeywordRule',
          severity: 'error',
          rule: 'forbidden_keywords',
          from: { role: 'CONTROLLER' },
          contains_forbidden: ['calculate', 'validate']
        }]
      });

      const result = await sut.load('/test/project');
      expect(result.rules[0]).toHaveProperty('contains_forbidden');
    });

    it('should throw error for forbidden_keywords rule without from.role', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'CONTROLLER', path: '^src/controllers' }],
        rules: [{
          name: 'KeywordRule',
          severity: 'error',
          rule: 'forbidden_keywords',
          contains_forbidden: ['console.log']
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'from'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'from'"
      );
    });

    it('should throw error for forbidden_keywords rule without contains_forbidden', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'CONTROLLER', path: '^src/controllers' }],
        rules: [{
          name: 'KeywordRule',
          severity: 'error',
          rule: 'forbidden_keywords',
          from: { role: 'CONTROLLER' }
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'contains_forbidden'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'contains_forbidden'"
      );
    });

    it('should throw error for forbidden_keywords rule with empty contains_forbidden', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'CONTROLLER', path: '^src/controllers' }],
        rules: [{
          name: 'KeywordRule',
          severity: 'error',
          rule: 'forbidden_keywords',
          from: { role: 'CONTROLLER' },
          contains_forbidden: []
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must NOT have fewer than 1 items"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must NOT have fewer than 1 items"
      );
    });

    it('should validate required_structure rule', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'StructureRule',
          severity: 'error',
          rule: 'required_structure',
          required_directories: ['src/domain', 'src/data']
        }]
      });

      const result = await sut.load('/test/project');
      expect(result.rules[0]).toHaveProperty('required_directories');
    });

    it('should throw error for required_structure rule without required_directories', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'StructureRule',
          severity: 'error',
          rule: 'required_structure'
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'required_directories'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'required_directories'"
      );
    });

    it('should throw error for required_structure rule with empty required_directories', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'StructureRule',
          severity: 'error',
          rule: 'required_structure',
          required_directories: []
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must NOT have fewer than 1 items"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must NOT have fewer than 1 items"
      );
    });

    it('should validate documentation_required rule', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'DocRule',
          severity: 'warning',
          rule: 'documentation_required',
          for: { role: 'ALL' },
          min_lines: 50,
          requires_jsdoc: true
        }]
      });

      const result = await sut.load('/test/project');
      expect(result.rules[0]).toHaveProperty('min_lines', 50);
      expect(result.rules[0]).toHaveProperty('requires_jsdoc', true);
    });

    it('should validate class_complexity rule', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'CLASS', path: '^src' }],
        rules: [{
          name: 'ComplexityRule',
          severity: 'error',
          rule: 'class_complexity',
          for: { role: 'CLASS' },
          max_public_methods: 10,
          max_properties: 15
        }]
      });

      const result = await sut.load('/test/project');
      expect(result.rules[0]).toHaveProperty('max_public_methods', 10);
      expect(result.rules[0]).toHaveProperty('max_properties', 15);
    });

    it('should validate dependency rules (forbidden, allowed, required)', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [
          { name: 'DOMAIN', path: '^src/domain' },
          { name: 'INFRA', path: '^src/infra' }
        ],
        rules: [{
          name: 'DepRule',
          severity: 'error',
          rule: 'forbidden',
          from: { role: 'DOMAIN' },
          to: { role: 'INFRA' }
        }]
      });

      const result = await sut.load('/test/project');
      expect(result.rules[0]).toHaveProperty('from');
      expect(result.rules[0]).toHaveProperty('to');
    });

    it('should handle circular dependency rule', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'CircularRule',
          severity: 'error',
          rule: 'forbidden',
          from: { role: 'ALL' },
          to: { circular: true }
        }]
      });

      const result = await sut.load('/test/project');
      expect(result.rules[0].to).toHaveProperty('circular', true);
    });

    it('should throw error for unknown rule type', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'UnknownRule',
          severity: 'error',
          rule: 'unknown_type'
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must be equal to one of the allowed values"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must be equal to one of the allowed values"
      );
    });

    it('should throw error for dependency rule with both role and circular in "to"', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'SERVICE', path: '^src/services' }],
        rules: [{
          name: 'BadRule',
          severity: 'error',
          rule: 'forbidden',
          from: { role: 'SERVICE' },
          to: { role: 'SERVICE', circular: true }
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must match exactly one schema in oneOf"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must match exactly one schema in oneOf"
      );
    });

    it('should throw error for dependency rule without from.role', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'SERVICE', path: '^src/services' }],
        rules: [{
          name: 'BadRule',
          severity: 'error',
          rule: 'forbidden',
          from: {},
          to: { role: 'SERVICE' }
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'role'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'role'"
      );
    });

    it('should throw error for dependency rule without to.role or to.circular', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'SERVICE', path: '^src/services' }],
        rules: [{
          name: 'BadRule',
          severity: 'error',
          rule: 'forbidden',
          from: { role: 'SERVICE' },
          to: {}
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must match exactly one schema"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must match exactly one schema"
      );
    });

    it('should throw error for class_complexity rule with invalid max_public_methods', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'CLASS', path: '^src' }],
        rules: [{
          name: 'ComplexityRule',
          severity: 'error',
          rule: 'class_complexity',
          for: { role: 'CLASS' },
          max_public_methods: 'invalid',
          max_properties: 10
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must be integer"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must be integer"
      );
    });

    it('should throw error for class_complexity rule with negative max_public_methods', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'CLASS', path: '^src' }],
        rules: [{
          name: 'ComplexityRule',
          severity: 'error',
          rule: 'class_complexity',
          for: { role: 'CLASS' },
          max_public_methods: -5,
          max_properties: 10
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must be >= 1"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must be >= 1"
      );
    });

    it('should throw error for class_complexity rule with invalid max_properties', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'CLASS', path: '^src' }],
        rules: [{
          name: 'ComplexityRule',
          severity: 'error',
          rule: 'class_complexity',
          for: { role: 'CLASS' },
          max_public_methods: 10,
          max_properties: 'invalid'
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must be integer"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must be integer"
      );
    });

    it('should throw error for documentation_required rule without for.role', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'DocRule',
          severity: 'warning',
          rule: 'documentation_required',
          min_lines: 50,
          requires_jsdoc: true
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'for'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'for'"
      );
    });

    it('should throw error for documentation_required rule with invalid min_lines', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'DocRule',
          severity: 'warning',
          rule: 'documentation_required',
          for: { role: 'ALL' },
          min_lines: 0,  // should be positive
          requires_jsdoc: true
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must be >= 1"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must be >= 1"
      );
    });

    it('should throw error for documentation_required rule with non-numeric min_lines', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'DocRule',
          severity: 'warning',
          rule: 'documentation_required',
          for: { role: 'ALL' },
          min_lines: 'fifty',  // should be number
          requires_jsdoc: true
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must be integer"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must be integer"
      );
    });

    it('should throw error for documentation_required rule with invalid requires_jsdoc', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'DocRule',
          severity: 'warning',
          rule: 'documentation_required',
          for: { role: 'ALL' },
          min_lines: 50,
          requires_jsdoc: 'yes' // should be boolean
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must be boolean"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must be boolean"
      );
    });

    it('should throw error for class_complexity rule without for.role', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'TEST', path: '^src' }],
        rules: [{
          name: 'ComplexityRule',
          severity: 'error',
          rule: 'class_complexity',
          max_public_methods: 10,
          max_properties: 15
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["missing required property 'for'"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "missing required property 'for'"
      );
    });

    it('should throw error for class_complexity rule with zero max_properties', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'CLASS', path: '^src' }],
        rules: [{
          name: 'ComplexityRule',
          severity: 'error',
          rule: 'class_complexity',
          for: { role: 'CLASS' },
          max_public_methods: 10,
          max_properties: 0
        }]
      });

      // Mock schema validator to return error
      vi.mocked(schemaValidatorMock.validate).mockReturnValue({
        valid: false,
        errors: ["must be >= 1"]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "must be >= 1"
      );
    });

    it('should handle detect_unreferenced rule without options', async () => {
      vi.mocked(fileSystemMock.existsSync).mockReturnValue(true);
      vi.mocked(fileSystemMock.readFileSync).mockReturnValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'SERVICE', path: '^src/services' }],
        rules: [{
          name: 'DetectUnused',
          severity: 'warning',
          rule: 'detect_unreferenced',
          for: { role: 'SERVICE' }
        }]
      });

      const result = await sut.load('/test/project');

      expect(result.rules).toHaveLength(1);
      expect(result.rules[0]).toMatchObject({
        name: 'DetectUnused',
        rule: 'detect_unreferenced',
        for: { role: 'SERVICE' },
        options: undefined
      });
    });
  });
});
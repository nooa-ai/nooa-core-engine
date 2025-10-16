import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as yaml from 'yaml';
import { YamlGrammarRepository } from '../../../src/infra/repositories/yaml-grammar.repository';

vi.mock('fs/promises');
vi.mock('yaml');

describe('YamlGrammarRepository', () => {
  let sut: YamlGrammarRepository;

  beforeEach(() => {
    sut = new YamlGrammarRepository();
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
rules:
  - name: TestRule
    severity: error
    from:
      role: DOMAIN
    to:
      role: INFRA
    rule: forbidden
`;

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(mockGrammarContent);
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [
          {
            name: 'DOMAIN',
            path: '^src/domain',
            description: 'Domain layer'
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

      expect(fs.access).toHaveBeenCalledWith('/test/project/nooa.grammar.yaml');
      expect(fs.readFile).toHaveBeenCalledWith('/test/project/nooa.grammar.yaml', 'utf-8');
      expect(result.version).toBe('1.0');
      expect(result.language).toBe('typescript');
      expect(result.roles).toHaveLength(1);
      expect(result.rules).toHaveLength(1);
    });

    it('should try .yml extension if .yaml not found', async () => {
      vi.mocked(fs.access)
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce(undefined);

      vi.mocked(fs.readFile).mockResolvedValue('version: "1.0"\nlanguage: typescript\nroles: []\nrules: []');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: []
      });

      await sut.load('/test/project');

      expect(fs.access).toHaveBeenCalledTimes(2);
      expect(fs.access).toHaveBeenNthCalledWith(1, '/test/project/nooa.grammar.yaml');
      expect(fs.access).toHaveBeenNthCalledWith(2, '/test/project/nooa.grammar.yml');
    });

    it('should throw error if no grammar file found', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Grammar file not found. Expected 'nooa.grammar.yaml' or 'nooa.grammar.yml'"
      );
    });

    it('should throw error if YAML parsing fails', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('invalid: yaml: content:');
      vi.mocked(yaml.parse).mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        'Failed to parse grammar file: Invalid YAML'
      );
    });

    it('should throw error if version is missing', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('language: typescript\nroles: []\nrules: []');
      vi.mocked(yaml.parse).mockReturnValue({
        language: 'typescript',
        roles: [],
        rules: []
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Missing required field 'version'"
      );
    });

    it('should throw error if language is missing', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('version: "1.0"\nroles: []\nrules: []');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        roles: [],
        rules: []
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Missing required field 'language'"
      );
    });

    it('should throw error if roles is not an array', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('version: "1.0"\nlanguage: typescript\nroles: "invalid"\nrules: []');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: 'invalid',
        rules: []
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Missing or invalid 'roles' array"
      );
    });

    it('should throw error if rules is not an array', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('version: "1.0"\nlanguage: typescript\nroles: []\nrules: "invalid"');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: 'invalid'
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Missing or invalid 'rules' array"
      );
    });

    it('should validate role with missing name', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ path: '^src/domain' }],
        rules: []
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Invalid role: missing or invalid 'name'"
      );
    });

    it('should validate role with missing path', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [{ name: 'DOMAIN' }],
        rules: []
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Invalid role 'DOMAIN': missing or invalid 'path'"
      );
    });

    it('should validate rule with missing name', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{ severity: 'error', rule: 'forbidden' }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Invalid rule: missing or invalid 'name'"
      );
    });

    it('should validate rule with invalid severity', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{ name: 'TestRule', severity: 'critical', rule: 'forbidden' }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Invalid rule 'TestRule': severity must be 'error', 'warning', or 'info'"
      );
    });

    it('should validate naming_pattern rule', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'NamingRule',
          severity: 'warning',
          rule: 'naming_pattern',
          for: { role: 'DOMAIN' }
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Invalid rule 'NamingRule': naming_pattern rules must have a 'pattern' string"
      );
    });

    it('should validate naming_pattern rule with invalid regex', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'NamingRule',
          severity: 'warning',
          rule: 'naming_pattern',
          for: { role: 'DOMAIN' },
          pattern: '[invalid'
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Invalid rule 'NamingRule': pattern is not a valid regular expression"
      );
    });

    it('should validate find_synonyms rule', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'TestRule',
          severity: 'error',
          rule: 'test_coverage',
          to: { test_file: 'required' }
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "test_coverage rules must have 'from.role'"
      );
    });

    it('should throw error for test_coverage rule without to.test_file', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'TestRule',
          severity: 'error',
          rule: 'test_coverage',
          from: { role: 'PROD' },
          to: {}
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "test_coverage rules must have 'to.test_file'"
      );
    });

    it('should validate forbidden_keywords rule', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'KeywordRule',
          severity: 'error',
          rule: 'forbidden_keywords',
          contains_forbidden: ['console.log']
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "forbidden_keywords rules must have 'from.role'"
      );
    });

    it('should throw error for forbidden_keywords rule without contains_forbidden', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'KeywordRule',
          severity: 'error',
          rule: 'forbidden_keywords',
          from: { role: 'CONTROLLER' }
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "forbidden_keywords rules must have 'contains_forbidden' as a non-empty array"
      );
    });

    it('should throw error for forbidden_keywords rule with empty contains_forbidden', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'KeywordRule',
          severity: 'error',
          rule: 'forbidden_keywords',
          from: { role: 'CONTROLLER' },
          contains_forbidden: []
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "forbidden_keywords rules must have 'contains_forbidden' as a non-empty array"
      );
    });

    it('should validate required_structure rule', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'StructureRule',
          severity: 'error',
          rule: 'required_structure'
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "required_structure rules must have 'required_directories' as a non-empty array"
      );
    });

    it('should throw error for required_structure rule with empty required_directories', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'StructureRule',
          severity: 'error',
          rule: 'required_structure',
          required_directories: []
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "required_structure rules must have 'required_directories' as a non-empty array"
      );
    });

    it('should validate documentation_required rule', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'UnknownRule',
          severity: 'error',
          rule: 'unknown_type'
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "Invalid rule 'UnknownRule': rule type must be"
      );
    });

    it('should throw error for dependency rule with both role and circular in "to"', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'BadRule',
          severity: 'error',
          rule: 'forbidden',
          from: { role: 'SERVICE' },
          to: { role: 'SERVICE', circular: true }
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "'to' cannot have both 'role' and 'circular'"
      );
    });

    it('should throw error for dependency rule without from.role', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'BadRule',
          severity: 'error',
          rule: 'forbidden',
          from: {},
          to: { role: 'SERVICE' }
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "dependency rules must have 'from.role'"
      );
    });

    it('should throw error for dependency rule without to.role or to.circular', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'BadRule',
          severity: 'error',
          rule: 'forbidden',
          from: { role: 'SERVICE' },
          to: {}
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "dependency rules must have 'to.role' or 'to.circular'"
      );
    });

    it('should throw error for class_complexity rule with invalid max_public_methods', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'ComplexityRule',
          severity: 'error',
          rule: 'class_complexity',
          for: { role: 'CLASS' },
          max_public_methods: 'invalid',
          max_properties: 10
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "class_complexity rules must have 'max_public_methods' as a positive number"
      );
    });

    it('should throw error for class_complexity rule with negative max_public_methods', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'ComplexityRule',
          severity: 'error',
          rule: 'class_complexity',
          for: { role: 'CLASS' },
          max_public_methods: -5,
          max_properties: 10
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "class_complexity rules must have 'max_public_methods' as a positive number"
      );
    });

    it('should throw error for class_complexity rule with invalid max_properties', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'ComplexityRule',
          severity: 'error',
          rule: 'class_complexity',
          for: { role: 'CLASS' },
          max_public_methods: 10,
          max_properties: 'invalid'
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "class_complexity rules must have 'max_properties' as a positive number"
      );
    });

    it('should throw error for documentation_required rule without for.role', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'DocRule',
          severity: 'warning',
          rule: 'documentation_required',
          min_lines: 50,
          requires_jsdoc: true
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "documentation_required rules must have 'for.role'"
      );
    });

    it('should throw error for documentation_required rule with invalid min_lines', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'DocRule',
          severity: 'warning',
          rule: 'documentation_required',
          for: { role: 'ALL' },
          min_lines: 0,  // should be positive
          requires_jsdoc: true
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "documentation_required rules must have 'min_lines' as a positive number"
      );
    });

    it('should throw error for documentation_required rule with non-numeric min_lines', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'DocRule',
          severity: 'warning',
          rule: 'documentation_required',
          for: { role: 'ALL' },
          min_lines: 'fifty',  // should be number
          requires_jsdoc: true
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "documentation_required rules must have 'min_lines' as a positive number"
      );
    });

    it('should throw error for documentation_required rule with invalid requires_jsdoc', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'DocRule',
          severity: 'warning',
          rule: 'documentation_required',
          for: { role: 'ALL' },
          min_lines: 50,
          requires_jsdoc: 'yes' // should be boolean
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "documentation_required rules must have 'requires_jsdoc' as a boolean"
      );
    });

    it('should throw error for class_complexity rule without for.role', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'ComplexityRule',
          severity: 'error',
          rule: 'class_complexity',
          max_public_methods: 10,
          max_properties: 15
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "class_complexity rules must have 'for.role'"
      );
    });

    it('should throw error for class_complexity rule with zero max_properties', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
        rules: [{
          name: 'ComplexityRule',
          severity: 'error',
          rule: 'class_complexity',
          for: { role: 'CLASS' },
          max_public_methods: 10,
          max_properties: 0
        }]
      });

      await expect(sut.load('/test/project')).rejects.toThrow(
        "class_complexity rules must have 'max_properties' as a positive number"
      );
    });

    it('should handle detect_unreferenced rule without options', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('mock');
      vi.mocked(yaml.parse).mockReturnValue({
        version: '1.0',
        language: 'typescript',
        roles: [],
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
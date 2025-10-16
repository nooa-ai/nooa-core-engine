import { describe, it, expect, beforeEach } from 'vitest';
import { RuleExtractorHelper } from '../../../src/data/helpers/rule-extractor.helper';
import {
  makeDependencyRuleMock,
  makeNamingPatternRuleMock,
} from '../../../src/domain/mocks';
import { FileSizeRule, ClassComplexityRule } from '../../../src/domain/models';

describe('RuleExtractorHelper', () => {
  let sut: RuleExtractorHelper;

  beforeEach(() => {
    sut = new RuleExtractorHelper();
  });

  describe('extract', () => {
    it('should return empty arrays when given empty rules array', () => {
      const result = sut.extract([]);

      expect(result.namingPatternRules).toEqual([]);
      expect(result.dependencyRules).toEqual([]);
      expect(result.synonymRules).toEqual([]);
      expect(result.unreferencedRules).toEqual([]);
      expect(result.fileSizeRules).toEqual([]);
      expect(result.testCoverageRules).toEqual([]);
      expect(result.forbiddenKeywordsRules).toEqual([]);
      expect(result.requiredStructureRules).toEqual([]);
      expect(result.documentationRules).toEqual([]);
      expect(result.classComplexityRules).toEqual([]);
      expect(result.minimumTestRatioRules).toEqual([]);
      expect(result.granularityMetricRules).toEqual([]);
      expect(result.forbiddenPatternsRules).toEqual([]);
      expect(result.barrelPurityRules).toEqual([]);
    });

    it('should extract dependency rules (forbidden)', () => {
      const rules = [makeDependencyRuleMock({ rule: 'forbidden' })];

      const result = sut.extract(rules);

      expect(result.dependencyRules).toHaveLength(1);
      expect(result.dependencyRules[0].rule).toBe('forbidden');
    });

    it('should extract dependency rules (required)', () => {
      const rules = [makeDependencyRuleMock({ rule: 'required' })];

      const result = sut.extract(rules);

      expect(result.dependencyRules).toHaveLength(1);
      expect(result.dependencyRules[0].rule).toBe('required');
    });

    it('should extract dependency rules (allowed)', () => {
      const rules = [makeDependencyRuleMock({ rule: 'allowed' })];

      const result = sut.extract(rules);

      expect(result.dependencyRules).toHaveLength(1);
      expect(result.dependencyRules[0].rule).toBe('allowed');
    });

    it('should extract all three types of dependency rules', () => {
      const rules = [
        makeDependencyRuleMock({ rule: 'forbidden', name: 'Forbidden-1' }),
        makeDependencyRuleMock({ rule: 'required', name: 'Required-1' }),
        makeDependencyRuleMock({ rule: 'allowed', name: 'Allowed-1' }),
      ];

      const result = sut.extract(rules);

      expect(result.dependencyRules).toHaveLength(3);
      expect(result.dependencyRules.map((r) => r.rule)).toEqual(['forbidden', 'required', 'allowed']);
    });

    it('should extract naming pattern rules', () => {
      const rules = [makeNamingPatternRuleMock()];

      const result = sut.extract(rules);

      expect(result.namingPatternRules).toHaveLength(1);
      expect(result.namingPatternRules[0].rule).toBe('naming_pattern');
    });

    it('should extract file size rules', () => {
      const rules: FileSizeRule[] = [
        {
          name: 'File-Size-Rule',
          severity: 'error',
          for: { role: 'ALL' },
          rule: 'file_size',
          max_lines: 200,
        },
      ];

      const result = sut.extract(rules);

      expect(result.fileSizeRules).toHaveLength(1);
      expect(result.fileSizeRules[0].rule).toBe('file_size');
    });

    it('should extract class complexity rules', () => {
      const rules: ClassComplexityRule[] = [
        {
          name: 'No-God-Objects',
          severity: 'error',
          for: { role: 'ALL' },
          rule: 'class_complexity',
          max_public_methods: 10,
          max_properties: 15,
        },
      ];

      const result = sut.extract(rules);

      expect(result.classComplexityRules).toHaveLength(1);
      expect(result.classComplexityRules[0].rule).toBe('class_complexity');
    });

    it('should categorize mixed rule types correctly', () => {
      const rules = [
        makeDependencyRuleMock({ rule: 'forbidden' }),
        makeNamingPatternRuleMock(),
        {
          name: 'File-Size-Rule',
          severity: 'error',
          for: { role: 'ALL' },
          rule: 'file_size' as const,
          max_lines: 200,
        },
        makeDependencyRuleMock({ rule: 'required' }),
        {
          name: 'No-God-Objects',
          severity: 'error',
          for: { role: 'ALL' },
          rule: 'class_complexity' as const,
          max_public_methods: 10,
          max_properties: 15,
        },
      ];

      const result = sut.extract(rules);

      expect(result.dependencyRules).toHaveLength(2);
      expect(result.namingPatternRules).toHaveLength(1);
      expect(result.fileSizeRules).toHaveLength(1);
      expect(result.classComplexityRules).toHaveLength(1);
    });

    it('should handle multiple rules of the same type', () => {
      const rules = [
        makeDependencyRuleMock({ rule: 'forbidden', name: 'Forbidden-1' }),
        makeDependencyRuleMock({ rule: 'forbidden', name: 'Forbidden-2' }),
        makeDependencyRuleMock({ rule: 'forbidden', name: 'Forbidden-3' }),
      ];

      const result = sut.extract(rules);

      expect(result.dependencyRules).toHaveLength(3);
      expect(result.dependencyRules.map((r) => r.name)).toEqual(['Forbidden-1', 'Forbidden-2', 'Forbidden-3']);
    });

    it('should return empty arrays for rule types not present', () => {
      const rules = [makeDependencyRuleMock()];

      const result = sut.extract(rules);

      expect(result.namingPatternRules).toEqual([]);
      expect(result.fileSizeRules).toEqual([]);
      expect(result.classComplexityRules).toEqual([]);
      expect(result.synonymRules).toEqual([]);
      expect(result.testCoverageRules).toEqual([]);
    });

    it('should maintain original rule properties', () => {
      const rules: FileSizeRule[] = [
        {
          name: 'Custom-File-Size-Rule',
          severity: 'error',
          for: { role: 'ALL' },
          rule: 'file_size',
          max_lines: 500,
        },
      ];

      const result = sut.extract(rules);

      expect(result.fileSizeRules[0].name).toBe('Custom-File-Size-Rule');
      expect(result.fileSizeRules[0].severity).toBe('error');
      expect(result.fileSizeRules[0].max_lines).toBe(500);
    });

    it('should correctly type-guard dependency rules', () => {
      const rules = [
        makeDependencyRuleMock({ rule: 'forbidden' }),
        makeNamingPatternRuleMock(),
      ];

      const result = sut.extract(rules);

      // TypeScript should recognize these as DependencyRule type
      result.dependencyRules.forEach((rule) => {
        expect(rule).toHaveProperty('from');
        expect(rule).toHaveProperty('to');
        expect(['forbidden', 'required', 'allowed']).toContain(rule.rule);
      });
    });

    it('should correctly type-guard naming pattern rules', () => {
      const rules = [
        makeNamingPatternRuleMock(),
        makeDependencyRuleMock(),
      ];

      const result = sut.extract(rules);

      // TypeScript should recognize these as NamingPatternRule type
      result.namingPatternRules.forEach((rule) => {
        expect(rule).toHaveProperty('for');
        expect(rule).toHaveProperty('pattern');
        expect(rule.rule).toBe('naming_pattern');
      });
    });

    it('should correctly type-guard file size rules', () => {
      const rules: FileSizeRule[] = [
        {
          name: 'File-Size-Rule',
          severity: 'error',
          for: { role: 'ALL' },
          rule: 'file_size',
          max_lines: 200,
        },
      ];

      const result = sut.extract(rules);

      // TypeScript should recognize these as FileSizeRule type
      result.fileSizeRules.forEach((rule) => {
        expect(rule).toHaveProperty('for');
        expect(rule).toHaveProperty('max_lines');
        expect(rule.rule).toBe('file_size');
      });
    });

    it('should correctly type-guard class complexity rules', () => {
      const rules: ClassComplexityRule[] = [
        {
          name: 'No-God-Objects',
          severity: 'error',
          for: { role: 'ALL' },
          rule: 'class_complexity',
          max_public_methods: 10,
          max_properties: 15,
        },
      ];

      const result = sut.extract(rules);

      // TypeScript should recognize these as ClassComplexityRule type
      result.classComplexityRules.forEach((rule) => {
        expect(rule).toHaveProperty('for');
        expect(rule).toHaveProperty('max_public_methods');
        expect(rule).toHaveProperty('max_properties');
        expect(rule.rule).toBe('class_complexity');
      });
    });
  });
});

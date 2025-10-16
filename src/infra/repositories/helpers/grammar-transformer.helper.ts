/**
 * Grammar Transformer Helper
 *
 * Transforms validated YAML content into GrammarModel domain objects.
 */

import { GrammarModel } from '../../../domain/models';

export class GrammarTransformerHelper {
  /**
   * Transforms validated YAML content to GrammarModel
   *
   * @param content - Validated YAML content
   * @returns Transformed GrammarModel
   */
  transform(content: any): GrammarModel {
    return {
      version: content.version,
      language: content.language,
      roles: this.transformRoles(content.roles),
      rules: this.transformRules(content.rules),
    };
  }

  /**
   * Transforms roles array
   */
  private transformRoles(roles: any[]): GrammarModel['roles'] {
    return roles.map((role: any) => ({
      name: role.name,
      path: role.path,
      description: role.description,
    }));
  }

  /**
   * Transforms rules array
   */
  private transformRules(rules: any[]): GrammarModel['rules'] {
    return rules.map((rule: any) => {
      const baseRule = {
        name: rule.name,
        severity: rule.severity,
        comment: rule.comment,
      };

      return this.transformRuleByType(rule, baseRule);
    });
  }

  /**
   * Transforms a rule based on its type
   */
  private transformRuleByType(rule: any, baseRule: any): any {
    const transformers: Record<string, (rule: any, baseRule: any) => any> = {
      naming_pattern: this.transformNamingPatternRule.bind(this),
      find_synonyms: this.transformFindSynonymsRule.bind(this),
      detect_unreferenced: this.transformDetectUnreferencedRule.bind(this),
      file_size: this.transformFileSizeRule.bind(this),
      test_coverage: this.transformTestCoverageRule.bind(this),
      forbidden_keywords: this.transformForbiddenKeywordsRule.bind(this),
      required_structure: this.transformRequiredStructureRule.bind(this),
      documentation_required: this.transformDocumentationRequiredRule.bind(this),
      class_complexity: this.transformClassComplexityRule.bind(this),
      minimum_test_ratio: this.transformMinimumTestRatioRule.bind(this),
      granularity_metric: this.transformGranularityMetricRule.bind(this),
      forbidden_patterns: this.transformForbiddenPatternsRule.bind(this),
      barrel_purity: this.transformBarrelPurityRule.bind(this),
    };

    if (transformers[rule.rule]) {
      return transformers[rule.rule](rule, baseRule);
    } else {
      // Dependency rule (allowed, forbidden, required)
      return this.transformDependencyRule(rule, baseRule);
    }
  }

  private transformNamingPatternRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: {
        role: rule.for.role,
      },
      pattern: rule.pattern,
      rule: 'naming_pattern' as const,
    };
  }

  private transformFindSynonymsRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: {
        role: rule.for.role,
      },
      options: {
        similarity_threshold: rule.options.similarity_threshold,
        thesaurus: rule.options.thesaurus,
      },
      rule: 'find_synonyms' as const,
    };
  }

  private transformDetectUnreferencedRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: {
        role: rule.for.role,
      },
      options: rule.options
        ? {
            ignore_patterns: rule.options.ignore_patterns,
          }
        : undefined,
      rule: 'detect_unreferenced' as const,
    };
  }

  private transformFileSizeRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: {
        role: rule.for.role,
      },
      max_lines: rule.max_lines,
      rule: 'file_size' as const,
    };
  }

  private transformTestCoverageRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      from: {
        role: rule.from.role,
      },
      to: {
        test_file: rule.to.test_file,
      },
      rule: 'test_coverage' as const,
    };
  }

  private transformForbiddenKeywordsRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      from: {
        role: rule.from.role,
      },
      contains_forbidden: rule.contains_forbidden,
      rule: 'forbidden_keywords' as const,
    };
  }

  private transformRequiredStructureRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      required_directories: rule.required_directories,
      rule: 'required_structure' as const,
    };
  }

  private transformDocumentationRequiredRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: {
        role: rule.for.role,
      },
      min_lines: rule.min_lines,
      requires_jsdoc: rule.requires_jsdoc,
      rule: 'documentation_required' as const,
    };
  }

  private transformClassComplexityRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: {
        role: rule.for.role,
      },
      max_public_methods: rule.max_public_methods,
      max_properties: rule.max_properties,
      rule: 'class_complexity' as const,
    };
  }

  private transformMinimumTestRatioRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      global: {
        test_ratio: rule.global.test_ratio,
      },
      rule: 'minimum_test_ratio' as const,
    };
  }

  private transformGranularityMetricRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      global: {
        target_loc_per_file: rule.global.target_loc_per_file,
        warning_threshold_multiplier: rule.global.warning_threshold_multiplier,
      },
      rule: 'granularity_metric' as const,
    };
  }

  private transformForbiddenPatternsRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      from: {
        role: rule.from.role,
      },
      contains_forbidden: rule.contains_forbidden,
      rule: 'forbidden_patterns' as const,
    };
  }

  private transformBarrelPurityRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: {
        file_pattern: rule.for.file_pattern,
      },
      contains_forbidden: rule.contains_forbidden,
      rule: 'barrel_purity' as const,
    };
  }

  private transformDependencyRule(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      from: {
        role: rule.from.role,
      },
      to: rule.to.circular
        ? { circular: true as const }
        : { role: rule.to.role },
      rule: rule.rule,
    };
  }
}

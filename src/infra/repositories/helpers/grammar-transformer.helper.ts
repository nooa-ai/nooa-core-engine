/**
 * Grammar Transformer Helper
 *
 * Transforms validated YAML content into GrammarModel domain objects.
 */

import { GrammarModel } from '../../../domain/models';
import { HygieneRuleTransformer, MetricsRuleTransformer } from './rule-transformers';

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
      // Hygiene rules
      naming_pattern: HygieneRuleTransformer.transformNamingPattern,
      find_synonyms: HygieneRuleTransformer.transformFindSynonyms,
      detect_unreferenced: HygieneRuleTransformer.transformDetectUnreferenced,
      forbidden_keywords: HygieneRuleTransformer.transformForbiddenKeywords,
      forbidden_patterns: HygieneRuleTransformer.transformForbiddenPatterns,
      barrel_purity: HygieneRuleTransformer.transformBarrelPurity,
      // Metrics rules
      file_size: MetricsRuleTransformer.transformFileSize,
      test_coverage: MetricsRuleTransformer.transformTestCoverage,
      required_structure: MetricsRuleTransformer.transformRequiredStructure,
      documentation_required: MetricsRuleTransformer.transformDocumentationRequired,
      class_complexity: MetricsRuleTransformer.transformClassComplexity,
      minimum_test_ratio: MetricsRuleTransformer.transformMinimumTestRatio,
      granularity_metric: MetricsRuleTransformer.transformGranularityMetric,
    };

    if (transformers[rule.rule]) {
      return transformers[rule.rule](rule, baseRule);
    } else {
      // Dependency rule (allowed, forbidden, required)
      return this.transformDependencyRule(rule, baseRule);
    }
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

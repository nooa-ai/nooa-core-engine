/**
 * Metrics Rule Transformers
 *
 * Transforms metrics-related rules (file size, complexity, test coverage, etc.)
 */

export class MetricsRuleTransformer {
  static transformFileSize(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: { role: rule.for.role },
      max_lines: rule.max_lines,
      rule: 'file_size' as const,
    };
  }

  static transformTestCoverage(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      from: { role: rule.from.role },
      to: { test_file: rule.to.test_file },
      rule: 'test_coverage' as const,
    };
  }

  static transformRequiredStructure(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      required_directories: rule.required_directories,
      rule: 'required_structure' as const,
    };
  }

  static transformDocumentationRequired(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: { role: rule.for.role },
      min_lines: rule.min_lines,
      requires_jsdoc: rule.requires_jsdoc,
      rule: 'documentation_required' as const,
    };
  }

  static transformClassComplexity(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: { role: rule.for.role },
      max_public_methods: rule.max_public_methods,
      max_properties: rule.max_properties,
      rule: 'class_complexity' as const,
    };
  }

  static transformMinimumTestRatio(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      global: { test_ratio: rule.global.test_ratio },
      rule: 'minimum_test_ratio' as const,
    };
  }

  static transformGranularityMetric(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      global: {
        target_loc_per_file: rule.global.target_loc_per_file,
        warning_threshold_multiplier: rule.global.warning_threshold_multiplier,
      },
      rule: 'granularity_metric' as const,
    };
  }
}

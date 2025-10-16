/**
 * Hygiene Rule Transformers
 *
 * Transforms hygiene-related rules (naming, synonyms, unreferenced files)
 */

export class HygieneRuleTransformer {
  static transformNamingPattern(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: { role: rule.for.role },
      pattern: rule.pattern,
      rule: 'naming_pattern' as const,
    };
  }

  static transformFindSynonyms(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: { role: rule.for.role },
      options: {
        similarity_threshold: rule.options.similarity_threshold,
        thesaurus: rule.options.thesaurus,
      },
      rule: 'find_synonyms' as const,
    };
  }

  static transformDetectUnreferenced(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: { role: rule.for.role },
      options: rule.options ? { ignore_patterns: rule.options.ignore_patterns } : undefined,
      rule: 'detect_unreferenced' as const,
    };
  }

  static transformForbiddenKeywords(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      from: { role: rule.from.role },
      contains_forbidden: rule.contains_forbidden,
      rule: 'forbidden_keywords' as const,
    };
  }

  static transformForbiddenPatterns(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      from: { role: rule.from.role },
      contains_forbidden: rule.contains_forbidden,
      rule: 'forbidden_patterns' as const,
    };
  }

  static transformBarrelPurity(rule: any, baseRule: any): any {
    return {
      ...baseRule,
      for: { file_pattern: rule.for.file_pattern },
      contains_forbidden: rule.contains_forbidden,
      rule: 'barrel_purity' as const,
    };
  }
}

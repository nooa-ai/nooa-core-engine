/**
 * Content Rule Types
 *
 * Types for rules that validate file content (keywords, patterns, barrel purity).
 * Extracted from architectural-rule.model.ts for better modularity.
 */

import { BaseRule, RuleFrom } from './base-rule.types';

/**
 * Forbidden keywords rule - prevents certain patterns in code
 */
export type ForbiddenKeywordsRule = BaseRule & {
  /** Which roles to check */
  from: RuleFrom;

  /** Keywords/patterns that are forbidden */
  contains_forbidden: string[];

  /** Rule type identifier */
  rule: 'forbidden_keywords';
};

/**
 * Forbidden patterns rule - Prevents specific regex patterns in code
 */
export type ForbiddenPatternsRule = BaseRule & {
  /** Which roles to check */
  from: RuleFrom;

  /** Regex patterns that are forbidden */
  contains_forbidden: string[];

  /** Rule type identifier */
  rule: 'forbidden_patterns';
};

/**
 * Barrel purity rule - Ensures barrel exports (index.ts) only re-export
 */
export type BarrelPurityRule = BaseRule & {
  /** File pattern to match (e.g., "/index\\.ts$") */
  for: {
    file_pattern: string;
  };

  /** Patterns that should not exist in barrel files */
  contains_forbidden: string[];

  /** Rule type identifier */
  rule: 'barrel_purity';
};

/**
 * Naming Rule Types
 *
 * Types for naming pattern validation rules.
 * Extracted from architectural-rule.model.ts for better modularity.
 */

import { BaseRule, RuleFor } from './base-rule.types';

/**
 * Naming pattern rule
 */
export type NamingPatternRule = BaseRule & {
  /** Which roles should conform to this pattern */
  for: RuleFor;

  /** Regular expression pattern that file paths must match */
  pattern: string;

  /** Rule type identifier for naming patterns */
  rule: 'naming_pattern';
};

/**
 * Dependency Rule Types
 *
 * Types for dependency-based architectural rules (allowed, forbidden, required).
 * Extracted from architectural-rule.model.ts for better modularity.
 */

import { BaseRule, RuleFrom, RoleReference } from './base-rule.types';

/**
 * Defines which roles are the target of a rule (target of dependency)
 * Can be either a role reference or a circular dependency check
 */
export type RuleTo =
  | { role: RoleReference; circular?: never }
  | { circular: true; role?: never };

/**
 * Dependency rule type defines whether a dependency is allowed, forbidden, or required
 */
export type DependencyRuleType = 'allowed' | 'forbidden' | 'required';

/**
 * Dependency-based architectural rule (forbidden, required, allowed)
 */
export type DependencyRule = BaseRule & {
  /** Source roles (who is making the dependency) */
  from: RuleFrom;

  /** Target roles (who is being depended upon) */
  to: RuleTo;

  /** Type of dependency rule */
  rule: DependencyRuleType;
};

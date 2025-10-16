/**
 * Base Rule Types
 *
 * Common types shared across all rule types.
 * Extracted from architectural-rule.model.ts for better modularity.
 */

/**
 * Role reference can be a single role, an array of roles, or the special "ALL" meta-role
 */
export type RoleReference = string | string[] | 'ALL';

/**
 * Severity level for rule violations
 */
export type RuleSeverity = 'error' | 'warning' | 'info';

/**
 * Defines which roles are subject to a rule (source of dependency)
 */
export type RuleFrom = {
  role: RoleReference;
};

/**
 * Defines which roles should conform to a naming pattern
 */
export type RuleFor = {
  role: RoleReference;
};

/**
 * Base properties shared by all rule types
 */
export type BaseRule = {
  /** Unique name identifier for the rule */
  name: string;

  /** Severity level when rule is violated */
  severity: RuleSeverity;

  /** Human-readable description of the rule (AI NOTE for self-healing) */
  comment?: string;
};

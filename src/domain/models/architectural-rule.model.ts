/**
 * Represents an architectural rule from the grammar configuration
 * This model defines the structure of rules that will be validated against the codebase
 */

/**
 * Role reference can be a single role, an array of roles, or the special "ALL" meta-role
 */
export type RoleReference = string | string[] | 'ALL';

/**
 * Defines which roles are subject to a rule (source of dependency)
 */
export type RuleFrom = {
  role: RoleReference;
};

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
 * Severity level for rule violations
 */
export type RuleSeverity = 'error' | 'warning' | 'info';

/**
 * Defines which roles should conform to a naming pattern
 */
export type RuleFor = {
  role: RoleReference;
};

/**
 * Base properties shared by all rule types
 */
type BaseRule = {
  /** Unique name identifier for the rule */
  name: string;

  /** Severity level when rule is violated */
  severity: RuleSeverity;

  /** Human-readable description of the rule */
  comment?: string;
};

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

/**
 * Options for synonym detection rule
 */
export type SynonymDetectionOptions = {
  /** Similarity threshold (0.0 to 1.0) - how similar names must be to trigger a warning */
  similarity_threshold: number;

  /** Thesaurus - groups of words considered synonyms */
  thesaurus?: string[][];
};

/**
 * Synonym detection rule (hygiene)
 * Detects classes with very similar names that might indicate duplication
 */
export type SynonymDetectionRule = BaseRule & {
  /** Which roles to check for synonyms */
  for: RuleFor;

  /** Rule type identifier for synonym detection */
  rule: 'find_synonyms';

  /** Configuration options for synonym detection */
  options: SynonymDetectionOptions;
};

/**
 * Options for unreferenced code detection rule
 */
export type UnreferencedCodeOptions = {
  /** Patterns of files to ignore (e.g., entry points, test files) */
  ignore_patterns?: string[];
};

/**
 * Unreferenced code detection rule (hygiene)
 * Detects files that are not imported by any other file (zombie code)
 */
export type UnreferencedCodeRule = BaseRule & {
  /** Which roles to check for unreferenced files */
  for: RuleFor;

  /** Rule type identifier for unreferenced code detection */
  rule: 'detect_unreferenced';

  /** Configuration options for unreferenced code detection */
  options?: UnreferencedCodeOptions;
};

/**
 * Complete architectural rule (discriminated union)
 * Can be a dependency rule, naming pattern rule, or hygiene rule
 */
export type ArchitecturalRuleModel =
  | DependencyRule
  | NamingPatternRule
  | SynonymDetectionRule
  | UnreferencedCodeRule;

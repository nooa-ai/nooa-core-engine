/**
 * Architectural Rule Model (Barrel Export)
 *
 * This file now acts as a barrel export, re-exporting all rule types
 * from their focused modules for convenient importing.
 *
 * Refactored from 308 LOC monolithic file to modular structure:
 * - base-rule.types.ts: Common types (43 LOC)
 * - dependency-rule.types.ts: Dependency rules (38 LOC)
 * - naming-rule.types.ts: Naming patterns (21 LOC)
 * - hygiene-rule.types.ts: Code hygiene (63 LOC)
 * - metrics-rule.types.ts: Code metrics (67 LOC)
 * - content-rule.types.ts: Content validation (54 LOC)
 * - structure-rule.types.ts: Structure validation (18 LOC)
 * - project-rule.types.ts: Project-level metrics (40 LOC)
 *
 * Total: 308 LOC → 8 files × ~40 LOC avg = Better modularity!
 */

// Base types (shared across all rules)
export type {
  RoleReference,
  RuleSeverity,
  RuleFrom,
  RuleFor,
  BaseRule,
} from './rules/base-rule.types';

// Dependency rules
export type {
  RuleTo,
  DependencyRuleType,
  DependencyRule,
} from './rules/dependency-rule.types';

// Naming pattern rules
export type {
  NamingPatternRule,
} from './rules/naming-rule.types';

// Hygiene rules
export type {
  SynonymDetectionOptions,
  SynonymDetectionRule,
  UnreferencedCodeOptions,
  UnreferencedCodeRule,
} from './rules/hygiene-rule.types';

// Metrics rules
export type {
  FileSizeRule,
  TestCoverageRule,
  ClassComplexityRule,
  DocumentationRequiredRule,
} from './rules/metrics-rule.types';

// Content rules
export type {
  ForbiddenKeywordsRule,
  ForbiddenPatternsRule,
  BarrelPurityRule,
} from './rules/content-rule.types';

// Structure rules
export type {
  RequiredStructureRule,
} from './rules/structure-rule.types';

// Project-level rules
export type {
  MinimumTestRatioRule,
  GranularityMetricRule,
} from './rules/project-rule.types';

// Import types for use in union (TypeScript requires this)
import type { DependencyRule } from './rules/dependency-rule.types';
import type { NamingPatternRule } from './rules/naming-rule.types';
import type {
  SynonymDetectionRule,
  UnreferencedCodeRule,
} from './rules/hygiene-rule.types';
import type {
  FileSizeRule,
  TestCoverageRule,
  ClassComplexityRule,
  DocumentationRequiredRule,
} from './rules/metrics-rule.types';
import type {
  ForbiddenKeywordsRule,
  ForbiddenPatternsRule,
  BarrelPurityRule,
} from './rules/content-rule.types';
import type { RequiredStructureRule } from './rules/structure-rule.types';
import type {
  MinimumTestRatioRule,
  GranularityMetricRule,
} from './rules/project-rule.types';

/**
 * Complete architectural rule (discriminated union)
 * Can be any of the specific rule types
 */
export type ArchitecturalRuleModel =
  | DependencyRule
  | NamingPatternRule
  | SynonymDetectionRule
  | UnreferencedCodeRule
  | FileSizeRule
  | TestCoverageRule
  | ForbiddenKeywordsRule
  | RequiredStructureRule
  | DocumentationRequiredRule
  | ClassComplexityRule
  | MinimumTestRatioRule
  | GranularityMetricRule
  | ForbiddenPatternsRule
  | BarrelPurityRule;

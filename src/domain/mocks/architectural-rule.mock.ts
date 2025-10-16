/**
 * Architectural Rule Test Mocks
 *
 * Provides factory functions for creating test fixtures of architectural rules.
 * These mocks enable consistent, DRY testing of use cases and validators that
 * work with architectural rules from the grammar.
 *
 * @module domain/mocks/architectural-rule
 *
 * Design rationale:
 * - **Test Data Builder Pattern:** Each factory function creates a valid rule
 *   with sensible defaults, accepting overrides for specific test scenarios
 * - **Type Safety:** Leverages TypeScript discriminated unions to ensure only
 *   valid rule combinations can be created
 * - **Reusability:** Centralizes test data creation, making tests more maintainable
 *   and reducing duplication across test suites
 *
 * @example Basic usage
 * ```typescript
 * // Create a forbidden dependency rule
 * const rule = makeDependencyRuleMock({ rule: 'forbidden' });
 *
 * // Create a naming pattern rule with custom pattern
 * const naming = makeNamingPatternRuleMock({
 *   pattern: '.*\\.controller\\.ts$',
 *   for: { role: 'CONTROLLER' }
 * });
 * ```
 *
 * @example Testing use cases
 * ```typescript
 * it('Should detect forbidden dependencies', () => {
 *   const rule = makeDependencyRuleMock({
 *     from: { role: 'DOMAIN' },
 *     to: { role: 'INFRA' },
 *     rule: 'forbidden'
 *   });
 *   const result = analyzeCodebase({ rules: [rule] });
 *   expect(result.violations).toContainViolation(rule.name);
 * });
 * ```
 */

import {
  ArchitecturalRuleModel,
  DependencyRule,
  DependencyRuleType,
  NamingPatternRule,
  RuleFor,
  RuleFrom,
  RuleSeverity,
  RuleTo,
  SynonymDetectionOptions,
  SynonymDetectionRule,
  UnreferencedCodeOptions,
  UnreferencedCodeRule,
} from '../models/architectural-rule.model';

const baseRule = {
  name: 'SAMPLE_RULE',
  severity: 'warning' as RuleSeverity,
  comment: 'Sample architectural rule used for testing.',
};

const baseFrom: RuleFrom = {
  role: 'SERVICE',
};

const baseTo: RuleTo = {
  role: 'REPOSITORY',
};

const baseFor: RuleFor = {
  role: 'CONTROLLER',
};

const baseSynonymOptions: SynonymDetectionOptions = {
  similarity_threshold: 0.9,
  thesaurus: [['create', 'build']],
};

const baseUnreferencedOptions: UnreferencedCodeOptions = {
  ignore_patterns: ['**/*.spec.ts'],
};

type DependencyRuleOverrides = Partial<DependencyRule> & {
  rule?: DependencyRuleType;
};

type NamingPatternRuleOverrides = Partial<NamingPatternRule> & {
  rule: 'naming_pattern';
};

type SynonymRuleOverrides = Partial<SynonymDetectionRule> & {
  rule: 'find_synonyms';
};

type UnreferencedRuleOverrides = Partial<UnreferencedCodeRule> & {
  rule: 'detect_unreferenced';
};

type ArchitecturalRuleOverrides =
  | DependencyRuleOverrides
  | NamingPatternRuleOverrides
  | SynonymRuleOverrides
  | UnreferencedRuleOverrides;

export const makeDependencyRuleMock = (
  overrides: Partial<DependencyRule> = {},
): DependencyRule => ({
  ...baseRule,
  from: { ...baseFrom },
  to: { ...baseTo },
  rule: 'allowed',
  ...overrides,
});

export const makeNamingPatternRuleMock = (
  overrides: Partial<NamingPatternRule> = {},
): NamingPatternRule => ({
  ...baseRule,
  for: { ...baseFor },
  pattern: '.*Service$',
  rule: 'naming_pattern',
  ...overrides,
});

export const makeSynonymDetectionRuleMock = (
  overrides: Partial<SynonymDetectionRule> = {},
): SynonymDetectionRule => ({
  ...baseRule,
  for: { ...baseFor },
  rule: 'find_synonyms',
  options: { ...baseSynonymOptions },
  ...overrides,
});

export const makeUnreferencedCodeRuleMock = (
  overrides: Partial<UnreferencedCodeRule> = {},
): UnreferencedCodeRule => ({
  ...baseRule,
  for: { ...baseFor },
  rule: 'detect_unreferenced',
  options: { ...baseUnreferencedOptions },
  ...overrides,
});

export const makeArchitecturalRuleMock = (
  overrides: ArchitecturalRuleOverrides = {},
): ArchitecturalRuleModel => {
  switch (overrides.rule) {
    case 'naming_pattern':
      return makeNamingPatternRuleMock(overrides);
    case 'find_synonyms':
      return makeSynonymDetectionRuleMock(overrides);
    case 'detect_unreferenced':
      return makeUnreferencedCodeRuleMock(overrides);
    default:
      return makeDependencyRuleMock(overrides);
  }
};

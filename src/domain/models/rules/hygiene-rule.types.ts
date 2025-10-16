/**
 * Hygiene Rule Types
 *
 * Types for code hygiene rules (synonym detection, zombie code detection).
 * Extracted from architectural-rule.model.ts for better modularity.
 */

import { BaseRule, RuleFor } from './base-rule.types';

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

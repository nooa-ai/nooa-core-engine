/**
 * Metrics Rule Types
 *
 * Types for code metrics rules (file size, test coverage, class complexity).
 * Extracted from architectural-rule.model.ts for better modularity.
 */

import { BaseRule, RuleFor, RuleFrom } from './base-rule.types';

/**
 * File size rule - validates that files don't exceed a certain size
 */
export type FileSizeRule = BaseRule & {
  /** Which roles to check for file size */
  for: RuleFor;

  /** Rule type identifier for file size validation */
  rule: 'file_size';

  /** Maximum lines allowed */
  max_lines: number;
};

/**
 * Test coverage rule - ensures production files have corresponding tests
 */
export type TestCoverageRule = BaseRule & {
  /** Source roles that need test coverage */
  from: RuleFrom;

  /** Indicates test files are required */
  to: { test_file: 'required' };

  /** Rule type identifier for test coverage */
  rule: 'test_coverage';
};

/**
 * Class complexity rule - prevents God objects
 */
export type ClassComplexityRule = BaseRule & {
  /** Which roles to check */
  for: RuleFor;

  /** Maximum public methods allowed */
  max_public_methods: number;

  /** Maximum properties allowed */
  max_properties: number;

  /** Rule type identifier */
  rule: 'class_complexity';
};

/**
 * Documentation required rule
 */
export type DocumentationRequiredRule = BaseRule & {
  /** Which roles to check */
  for: RuleFor;

  /** Minimum lines that trigger documentation requirement */
  min_lines: number;

  /** Whether JSDoc is required */
  requires_jsdoc: boolean;

  /** Rule type identifier */
  rule: 'documentation_required';
};

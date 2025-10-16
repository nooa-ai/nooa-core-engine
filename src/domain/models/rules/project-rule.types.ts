/**
 * Project Rule Types
 *
 * Types for project-level rules (test ratio, granularity metrics).
 * Extracted from architectural-rule.model.ts for better modularity.
 */

import { BaseRule } from './base-rule.types';

/**
 * Minimum test ratio rule - Enforces minimum percentage of test files
 */
export type MinimumTestRatioRule = BaseRule & {
  /** Global configuration */
  global: {
    /** Minimum ratio of test files to production files (0.0 to 1.0) */
    test_ratio: number;
  };

  /** Rule type identifier */
  rule: 'minimum_test_ratio';
};

/**
 * Granularity metric rule - Checks file granularity (lines per file)
 */
export type GranularityMetricRule = BaseRule & {
  /** Global configuration */
  global: {
    /** Target lines of code per file */
    target_loc_per_file: number;
    /** Warning threshold multiplier */
    warning_threshold_multiplier: number;
  };

  /** Rule type identifier */
  rule: 'granularity_metric';
};

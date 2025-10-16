/**
 * Structure Rule Types
 *
 * Types for rules that validate project structure (required directories).
 * Extracted from architectural-rule.model.ts for better modularity.
 */

import { BaseRule } from './base-rule.types';

/**
 * Required structure rule - ensures certain directories exist
 */
export type RequiredStructureRule = BaseRule & {
  /** Required directory paths */
  required_directories: string[];

  /** Rule type identifier */
  rule: 'required_structure';
};

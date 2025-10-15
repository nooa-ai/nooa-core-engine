/**
 * Represents a violation of an architectural rule detected in the codebase
 */

import { RuleSeverity } from './architectural-rule.model';

/**
 * Complete information about an architectural violation
 */
export type ArchitecturalViolationModel = {
  /** Name of the rule that was violated */
  ruleName: string;

  /** Severity of the violation */
  severity: RuleSeverity;

  /** File path where the violation occurred */
  file: string;

  /** Human-readable message describing the violation */
  message: string;

  /** Optional: The role of the file that violated the rule */
  fromRole?: string;

  /** Optional: The role that was incorrectly depended upon */
  toRole?: string;

  /** Optional: The specific dependency that caused the violation */
  dependency?: string;
};

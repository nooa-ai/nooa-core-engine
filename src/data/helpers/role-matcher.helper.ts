/**
 * Role Matcher Helper
 *
 * Provides utility for matching symbol roles against rule role references.
 * Handles string, array, and "ALL" role patterns.
 */
import { RoleReference } from '../../domain/models';

export class RoleMatcherHelper {
  /**
   * Checks if a symbol's role matches a role reference (can be string or array)
   *
   * @param symbolRole - The role of a symbol
   * @param ruleRole - The role reference from a rule (string or string[])
   * @returns True if the symbol role matches the rule role
   */
  matches(symbolRole: string, ruleRole: RoleReference): boolean {
    if (ruleRole === 'ALL') {
      return true; // Match any role
    }
    if (Array.isArray(ruleRole)) {
      return ruleRole.includes(symbolRole);
    }
    return symbolRole === ruleRole;
  }
}

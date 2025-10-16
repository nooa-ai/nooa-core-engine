/**
 * Helper: Role Assignment
 *
 * Responsible for assigning architectural roles to code symbols based on path patterns.
 * Maps file paths to roles defined in grammar (NOUN, VERB, ADVERB, CONTEXT, etc.).
 *
 * Performance optimization: Compiles regex patterns once and reuses for all symbols.
 *
 * Following Single Responsibility Principle: Only handles role assignment logic.
 */

import { CodeSymbolModel, GrammarModel } from '../../domain/models';

export class RoleAssignmentHelper {
  /**
   * Assigns architectural roles to code symbols based on path patterns
   *
   * @param symbols - Code symbols extracted from the codebase
   * @param grammar - Grammar configuration with role definitions
   * @returns Symbols with assigned roles
   */
  assign(symbols: CodeSymbolModel[], grammar: GrammarModel): CodeSymbolModel[] {
    // Compile regex patterns once (performance optimization)
    const rolesWithPatterns = grammar.roles.map((role) => ({
      name: role.name,
      pattern: new RegExp(role.path),
    }));

    return symbols.map((symbol) => {
      // Find the first role whose path pattern matches the symbol's path
      const matchingRole = rolesWithPatterns.find((role) =>
        role.pattern.test(symbol.path)
      );

      return {
        ...symbol,
        role: matchingRole?.name || 'UNKNOWN',
      };
    });
  }
}

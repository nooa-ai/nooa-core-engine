/**
 * Semantic Grammar Validator
 *
 * Validates semantic constraints that JSON Schema cannot enforce:
 * - Regex pattern validity
 * - Role references exist
 * - Rule name uniqueness
 *
 * This replaces the 277 LOC grammar-validator.helper.ts which was 70% duplicate
 * of schema validation. Schema handles structural validation (types, required fields),
 * this handles business rules (references, uniqueness).
 */

export class SemanticGrammarValidator {
  /**
   * Validates semantic constraints in grammar
   *
   * @param grammar - Parsed and schema-validated grammar object
   * @param filePath - Path to grammar file (for error messages)
   * @throws Error if semantic validation fails
   */
  validate(grammar: any, filePath: string): void {
    this.validateRegexPatterns(grammar, filePath);
    this.validateRoleReferences(grammar, filePath);
    this.validateRuleNameUniqueness(grammar, filePath);
  }

  /**
   * Validates that all regex patterns are valid
   * Checks patterns in: naming_pattern, forbidden_patterns, barrel_purity rules
   */
  private validateRegexPatterns(grammar: any, filePath: string): void {
    for (const rule of grammar.rules) {
      // Naming pattern rules
      if (rule.rule === 'naming_pattern' && rule.pattern) {
        this.validateRegex(rule.pattern, rule.name, filePath);
      }

      // Forbidden patterns rules
      if (rule.rule === 'forbidden_patterns' && rule.contains_forbidden) {
        for (const pattern of rule.contains_forbidden) {
          this.validateRegex(pattern, rule.name, filePath);
        }
      }

      // Barrel purity rules
      if (rule.rule === 'barrel_purity') {
        if (rule.for?.file_pattern) {
          this.validateRegex(rule.for.file_pattern, rule.name, filePath);
        }
        if (rule.contains_forbidden) {
          for (const pattern of rule.contains_forbidden) {
            this.validateRegex(pattern, rule.name, filePath);
          }
        }
      }
    }
  }

  /**
   * Validates that role references point to existing roles
   * Checks from.role, to.role, for.role in rules
   */
  private validateRoleReferences(grammar: any, filePath: string): void {
    const roleNames = new Set<string>(grammar.roles.map((r: any) => r.name));
    roleNames.add('ALL'); // Special meta-role

    for (const rule of grammar.rules) {
      // Validate from.role
      if (rule.from?.role) {
        this.validateRoleReference(rule.from.role, roleNames, rule.name, 'from.role', filePath);
      }

      // Validate to.role (if not circular)
      if (rule.to?.role) {
        this.validateRoleReference(rule.to.role, roleNames, rule.name, 'to.role', filePath);
      }

      // Validate for.role
      if (rule.for?.role) {
        this.validateRoleReference(rule.for.role, roleNames, rule.name, 'for.role', filePath);
      }
    }
  }

  /**
   * Validates that rule names are unique
   */
  private validateRuleNameUniqueness(grammar: any, filePath: string): void {
    const ruleNames = new Set<string>();

    for (const rule of grammar.rules) {
      if (ruleNames.has(rule.name)) {
        throw new Error(
          `Duplicate rule name '${rule.name}' in ${filePath}. Rule names must be unique.`
        );
      }
      ruleNames.add(rule.name);
    }
  }

  /**
   * Helper: Validates a single role reference (can be string, array, or 'ALL')
   */
  private validateRoleReference(
    roleRef: string | string[],
    validRoles: Set<string>,
    ruleName: string,
    field: string,
    filePath: string
  ): void {
    const roles = Array.isArray(roleRef) ? roleRef : [roleRef];

    for (const role of roles) {
      if (!validRoles.has(role)) {
        throw new Error(
          `Invalid rule '${ruleName}': ${field} references undefined role '${role}' in ${filePath}. ` +
          `Available roles: ${Array.from(validRoles).join(', ')}`
        );
      }
    }
  }

  /**
   * Helper: Validates a regex pattern is valid
   */
  private validateRegex(pattern: string, ruleName: string, filePath: string): void {
    try {
      new RegExp(pattern);
    } catch (error) {
      throw new Error(
        `Invalid rule '${ruleName}': pattern '${pattern}' is not a valid regular expression in ${filePath}`
      );
    }
  }
}

/**
 * Naming Pattern Validator
 *
 * Validates that symbols follow naming pattern conventions.
 */
import { ArchitecturalViolationModel, CodeSymbolModel, NamingPatternRule } from '../../domain/models';
import { BaseRuleValidator } from './base-rule.validator';

export class NamingPatternValidator extends BaseRuleValidator {
  constructor(private readonly rules: NamingPatternRule[]) {
    super();
  }

  async validate(symbols: CodeSymbolModel[], _projectPath: string): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    for (const rule of this.rules) {
      violations.push(...this.validateRule(symbols, rule));
    }

    return violations;
  }

  /**
   * Validates that symbols follow naming pattern conventions
   *
   * For each symbol matching the 'for' role, ensures its path matches the pattern.
   * If not, creates a violation.
   *
   * @param symbols - All code symbols
   * @param rule - The naming pattern rule to check
   * @returns Array of violations for symbols not matching the pattern
   */
  private validateRule(
    symbols: CodeSymbolModel[],
    rule: NamingPatternRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    // Compile the pattern regex
    const pattern = new RegExp(rule.pattern);

    // Find all symbols that match the 'for' role
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.for.role)
    );

    // For each matching symbol, check if its path matches the pattern
    for (const symbol of symbolsToCheck) {
      if (!pattern.test(symbol.path)) {
        // Path doesn't match the pattern - create a violation
        violations.push({
          ruleName: rule.name,
          severity: rule.severity,
          file: symbol.path,
          message: `${rule.name}: ${symbol.path} (${symbol.role}) does not match naming pattern "${rule.pattern}"${rule.comment ? ` - ${rule.comment}` : ''}`,
          fromRole: symbol.role,
          toRole: undefined,
          dependency: undefined,
        });
      }
    }

    return violations;
  }
}

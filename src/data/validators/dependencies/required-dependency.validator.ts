/**
 * Required Dependency Validator
 *
 * Validates that symbols have required dependencies.
 * Ensures specific roles depend on other required roles.
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  DependencyRule,
} from '../../../domain/models';
import { BaseRuleValidator } from '../base-rule.validator';

export class RequiredDependencyValidator extends BaseRuleValidator {
  constructor(private readonly rules: DependencyRule[]) {
    super();
  }

  async validate(
    symbols: CodeSymbolModel[],
    _projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const symbolMap = new Map<string, CodeSymbolModel>();
    symbols.forEach((symbol) => symbolMap.set(symbol.path, symbol));

    // Filter required dependency rules
    const requiredRules = this.rules.filter((rule) => rule.rule === 'required');

    for (const rule of requiredRules) {
      violations.push(...this.validateRequiredDependencies(symbols, symbolMap, rule));
    }

    return violations;
  }

  /**
   * Validates that required dependencies exist
   */
  private validateRequiredDependencies(
    symbols: CodeSymbolModel[],
    symbolMap: Map<string, CodeSymbolModel>,
    rule: DependencyRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    // Skip circular rules
    if ('circular' in rule.to && rule.to.circular) {
      return violations;
    }

    // Find all symbols that match the 'from' role
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.from.role)
    );

    for (const symbol of symbolsToCheck) {
      // Check if any of this symbol's dependencies match the 'to' role
      const hasRequiredDependency = symbol.dependencies.some((depPath) => {
        const depSymbol = symbolMap.get(depPath);
        if (!depSymbol) return false;

        if (!('role' in rule.to) || !rule.to.role) return false;

        return this.roleMatcher.matches(depSymbol.role, rule.to.role);
      });

      if (!hasRequiredDependency) {
        if (!('role' in rule.to) || !rule.to.role) continue;

        const roleDescription = Array.isArray(rule.to.role)
          ? rule.to.role.join(' or ')
          : rule.to.role;

        violations.push({
          ruleName: rule.name,
          severity: rule.severity,
          file: symbol.path,
          message: `${rule.name}: ${symbol.path} (${symbol.role}) must depend on at least one ${roleDescription}${rule.comment ? ` - ${rule.comment}` : ''}`,
          fromRole: symbol.role,
          toRole: roleDescription,
          dependency: undefined,
        });
      }
    }

    return violations;
  }
}

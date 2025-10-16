/**
 * Forbidden Dependency Checker
 *
 * Validates that symbols do not have forbidden dependencies.
 * Checks each dependency against forbidden rules.
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  DependencyRule,
} from '../../../domain/models';
import { BaseRuleValidator } from '../base-rule.validator';

export class ForbiddenDependencyChecker extends BaseRuleValidator {
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

    // Filter forbidden rules (excluding circular rules)
    const forbiddenRules = this.rules.filter(
      (rule) =>
        rule.rule === 'forbidden' &&
        (!('circular' in rule.to) || !rule.to.circular)
    );

    for (const symbol of symbols) {
      for (const dependency of symbol.dependencies) {
        const dependencySymbol = symbolMap.get(dependency);
        if (!dependencySymbol) continue;

        const violation = this.checkForbiddenDependency(symbol, dependencySymbol, forbiddenRules);
        if (violation) {
          violations.push(violation);
        }
      }
    }

    return violations;
  }

  /**
   * Checks if a dependency between two symbols violates any forbidden rules
   */
  private checkForbiddenDependency(
    fromSymbol: CodeSymbolModel,
    toSymbol: CodeSymbolModel,
    rules: DependencyRule[]
  ): ArchitecturalViolationModel | null {
    for (const rule of rules) {
      const fromRoleMatches = this.roleMatcher.matches(fromSymbol.role, rule.from.role);
      // Guard: rule.to.role can be undefined for circular rules
      if (!('role' in rule.to) || !rule.to.role) continue;
      const toRoleMatches = this.roleMatcher.matches(toSymbol.role, rule.to.role);

      if (fromRoleMatches && toRoleMatches) {
        return {
          ruleName: rule.name,
          severity: rule.severity,
          file: fromSymbol.path,
          message: `${rule.name}: ${fromSymbol.path} (${fromSymbol.role}) cannot depend on ${toSymbol.path} (${toSymbol.role})${rule.comment ? ` - ${rule.comment}` : ''}`,
          fromRole: fromSymbol.role,
          toRole: toSymbol.role,
          dependency: toSymbol.path,
        };
      }
    }
    return null;
  }
}

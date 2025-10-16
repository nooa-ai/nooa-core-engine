/**
 * Dependency Validator
 *
 * Validates dependencies between symbols including:
 * - Forbidden dependencies
 * - Required dependencies
 * - Circular dependencies
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  DependencyRule,
} from '../../domain/models';
import { BaseRuleValidator } from './base-rule.validator';

export class DependencyValidator extends BaseRuleValidator {
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

    // Check for circular dependency rules
    const circularRules = this.rules.filter(
      (rule) => 'to' in rule && rule.to && 'circular' in rule.to && rule.to.circular === true
    );
    for (const rule of circularRules) {
      violations.push(...this.detectCircularDependencies(symbols, symbolMap, rule));
    }

    // Check for required dependency rules
    const requiredRules = this.rules.filter((rule) => rule.rule === 'required');
    for (const rule of requiredRules) {
      violations.push(...this.validateRequiredDependencies(symbols, symbolMap, rule));
    }

    // Check for forbidden dependency rules
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

  /**
   * Detects circular dependencies using Depth-First Search (DFS)
   */
  private detectCircularDependencies(
    symbols: CodeSymbolModel[],
    symbolMap: Map<string, CodeSymbolModel>,
    rule: DependencyRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    enum VisitState {
      WHITE = 'WHITE',
      GRAY = 'GRAY',
      BLACK = 'BLACK',
    }

    const state = new Map<string, VisitState>();
    symbols.forEach((symbol) => state.set(symbol.path, VisitState.WHITE));

    const dfsVisit = (symbolPath: string, path: string[]): string[] | null => {
      const symbol = symbolMap.get(symbolPath);
      if (!symbol) return null;

      const shouldCheck = this.roleMatcher.matches(symbol.role, rule.from.role);
      if (!shouldCheck) {
        state.set(symbolPath, VisitState.BLACK);
        return null;
      }

      state.set(symbolPath, VisitState.GRAY);
      path.push(symbolPath);

      for (const depPath of symbol.dependencies) {
        const depSymbol = symbolMap.get(depPath);
        if (!depSymbol) continue;

        const depState = state.get(depPath);

        if (depState === VisitState.GRAY) {
          const cycleStart = path.indexOf(depPath);
          if (cycleStart !== -1) {
            return [...path.slice(cycleStart), depPath];
          }
        } else if (depState === VisitState.WHITE) {
          const cyclePath = dfsVisit(depPath, [...path]);
          if (cyclePath) {
            return cyclePath;
          }
        }
      }

      state.set(symbolPath, VisitState.BLACK);
      return null;
    };

    for (const symbol of symbols) {
      if (state.get(symbol.path) === VisitState.WHITE) {
        const cyclePath = dfsVisit(symbol.path, []);
        if (cyclePath && cyclePath.length > 0) {
          const cycleDescription = cyclePath.join(' → ');
          violations.push({
            ruleName: rule.name,
            severity: rule.severity,
            file: cyclePath[0],
            message: `${rule.name}: Circular dependency detected: ${cycleDescription}${rule.comment ? ` - ${rule.comment}` : ''}`,
            fromRole: symbolMap.get(cyclePath[0])?.role,
            toRole: symbolMap.get(cyclePath[cyclePath.length - 1])?.role,
            dependency: cycleDescription,
          });

          cyclePath.forEach((path) => state.set(path, VisitState.BLACK));
        }
      }
    }

    return violations;
  }
}

/**
 * Circular Dependency Detector
 *
 * Detects circular dependencies between symbols using Depth-First Search (DFS).
 * Identifies cycles in the dependency graph.
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  DependencyRule,
} from '../../../domain/models';
import { BaseRuleValidator } from '../base-rule.validator';

export class CircularDependencyDetector extends BaseRuleValidator {
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

    // Filter circular dependency rules
    const circularRules = this.rules.filter(
      (rule) => 'to' in rule && rule.to && 'circular' in rule.to && rule.to.circular === true
    );

    for (const rule of circularRules) {
      violations.push(...this.detectCircularDependencies(symbols, symbolMap, rule));
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

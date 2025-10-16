/**
 * Class Complexity Validator
 *
 * Validates class complexity based on public method and property counts.
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  ClassComplexityRule,
} from '../../../domain/models';
import { BaseRuleValidator } from '../base-rule.validator';

export class ClassComplexityValidator extends BaseRuleValidator {
  constructor(private readonly rules: ClassComplexityRule[]) {
    super();
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    for (const rule of this.rules) {
      violations.push(...(await this.validateClassComplexity(symbols, rule, projectPath)));
    }

    return violations;
  }

  private async validateClassComplexity(
    symbols: CodeSymbolModel[],
    rule: ClassComplexityRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');

    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.for.role)
    );

    for (const symbol of symbolsToCheck) {
      try {
        const filePath = path.join(projectPath, symbol.path);
        const content = await fs.readFile(filePath, 'utf-8');

        const publicMethodPattern = /public\s+\w+\s*\(/g;
        const publicMethods = content.match(publicMethodPattern) || [];

        const propertyPattern = /(?:public|private|protected)?\s+\w+\s*[:=]/g;
        const properties = content.match(propertyPattern) || [];

        if (publicMethods.length > rule.max_public_methods) {
          violations.push({
            ruleName: rule.name,
            severity: rule.severity,
            file: symbol.path,
            message: `${rule.name}: ${symbol.path} has ${publicMethods.length} public methods (exceeds ${rule.max_public_methods})${rule.comment ? ` - ${rule.comment}` : ''}`,
            fromRole: symbol.role,
            toRole: undefined,
            dependency: undefined,
          });
        }

        if (properties.length > rule.max_properties) {
          violations.push({
            ruleName: rule.name,
            severity: rule.severity,
            file: symbol.path,
            message: `${rule.name}: ${symbol.path} has ${properties.length} properties (exceeds ${rule.max_properties})${rule.comment ? ` - ${rule.comment}` : ''}`,
            fromRole: symbol.role,
            toRole: undefined,
            dependency: undefined,
          });
        }
      } catch (error) {
        // File might not exist or be readable, skip
      }
    }

    return violations;
  }
}

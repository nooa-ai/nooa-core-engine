/**
 * Code Pattern Validator
 *
 * Validates code patterns including:
 * - Forbidden keywords
 * - Forbidden regex patterns
 * - Barrel purity (index files should only re-export)
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  ForbiddenKeywordsRule,
  ForbiddenPatternsRule,
  BarrelPurityRule,
} from '../../domain/models';
import { BaseRuleValidator } from './base-rule.validator';

export class CodePatternValidator extends BaseRuleValidator {
  constructor(
    private readonly forbiddenKeywordsRules: ForbiddenKeywordsRule[],
    private readonly forbiddenPatternsRules: ForbiddenPatternsRule[],
    private readonly barrelPurityRules: BarrelPurityRule[]
  ) {
    super();
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    // Validate forbidden keywords
    for (const rule of this.forbiddenKeywordsRules) {
      violations.push(...(await this.validateForbiddenKeywords(symbols, rule, projectPath)));
    }

    // Validate forbidden patterns
    for (const rule of this.forbiddenPatternsRules) {
      violations.push(...(await this.validateForbiddenPatterns(symbols, rule, projectPath)));
    }

    // Validate barrel purity
    for (const rule of this.barrelPurityRules) {
      violations.push(...(await this.validateBarrelPurity(symbols, rule, projectPath)));
    }

    return violations;
  }

  private async validateForbiddenKeywords(
    symbols: CodeSymbolModel[],
    rule: ForbiddenKeywordsRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');

    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.from.role)
    );

    // Performance: Parallelize file reading with Promise.all()
    const validationPromises = symbolsToCheck.map(async (symbol) => {
      try {
        const filePath = path.join(projectPath, symbol.path);
        const content = await fs.readFile(filePath, 'utf-8');

        for (const keyword of rule.contains_forbidden) {
          if (content.includes(keyword)) {
            return {
              ruleName: rule.name,
              severity: rule.severity,
              file: symbol.path,
              message: `${rule.name}: ${symbol.path} contains forbidden keyword '${keyword}'${rule.comment ? ` - ${rule.comment}` : ''}`,
              fromRole: symbol.role,
              toRole: undefined,
              dependency: undefined,
            };
          }
        }
        return null;
      } catch (error) {
        // File might not exist or be readable, skip
        return null;
      }
    });

    const results = await Promise.all(validationPromises);
    return results.filter((v) => v !== null) as ArchitecturalViolationModel[];
  }

  private async validateForbiddenPatterns(
    symbols: CodeSymbolModel[],
    rule: ForbiddenPatternsRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');

    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.from.role)
    );

    // Performance: Parallelize file reading with Promise.all()
    const validationPromises = symbolsToCheck.map(async (symbol) => {
      try {
        const filePath = path.join(projectPath, symbol.path);
        const content = await fs.readFile(filePath, 'utf-8');

        for (const pattern of rule.contains_forbidden) {
          try {
            const regex = new RegExp(pattern);
            if (regex.test(content)) {
              return {
                ruleName: rule.name,
                severity: rule.severity,
                file: symbol.path,
                message: `${rule.name}: ${symbol.path} contains forbidden pattern '${pattern}'${rule.comment ? ` - ${rule.comment}` : ''}`,
                fromRole: symbol.role,
                toRole: undefined,
                dependency: undefined,
              };
            }
          } catch (error) {
            // Invalid regex pattern, skip
            continue;
          }
        }
        return null;
      } catch (error) {
        // File might not exist or be readable, skip
        return null;
      }
    });

    const results = await Promise.all(validationPromises);
    return results.filter((v) => v !== null) as ArchitecturalViolationModel[];
  }

  private async validateBarrelPurity(
    symbols: CodeSymbolModel[],
    rule: BarrelPurityRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');

    const filePattern = new RegExp(rule.for.file_pattern);
    const symbolsToCheck = symbols.filter((symbol) => filePattern.test(symbol.path));

    // Performance: Parallelize file reading with Promise.all()
    const validationPromises = symbolsToCheck.map(async (symbol) => {
      try {
        const filePath = path.join(projectPath, symbol.path);
        const content = await fs.readFile(filePath, 'utf-8');

        for (const pattern of rule.contains_forbidden) {
          try {
            const regex = new RegExp(pattern);
            if (regex.test(content)) {
              return {
                ruleName: rule.name,
                severity: rule.severity,
                file: symbol.path,
                message: `${rule.name}: Barrel file ${symbol.path} contains forbidden pattern '${pattern}' - should only re-export${rule.comment ? ` - ${rule.comment}` : ''}`,
                fromRole: symbol.role,
                toRole: undefined,
                dependency: undefined,
              };
            }
          } catch (error) {
            // Invalid regex pattern, skip
            continue;
          }
        }
        return null;
      } catch (error) {
        // File might not exist or be readable, skip
        return null;
      }
    });

    const results = await Promise.all(validationPromises);
    return results.filter((v) => v !== null) as ArchitecturalViolationModel[];
  }
}

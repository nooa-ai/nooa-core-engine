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
    projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    // Run all rule validations in parallel (performance optimization)
    const validationPromises: Promise<ArchitecturalViolationModel[]>[] = [];

    // Validate forbidden keywords
    for (const rule of this.forbiddenKeywordsRules) {
      validationPromises.push(this.validateForbiddenKeywords(symbols, rule, projectPath, fileCache));
    }

    // Validate forbidden patterns
    for (const rule of this.forbiddenPatternsRules) {
      validationPromises.push(this.validateForbiddenPatterns(symbols, rule, projectPath, fileCache));
    }

    // Validate barrel purity
    for (const rule of this.barrelPurityRules) {
      validationPromises.push(this.validateBarrelPurity(symbols, rule, projectPath, fileCache));
    }

    const results = await Promise.all(validationPromises);
    return results.flat();
  }

  private async validateForbiddenKeywords(
    symbols: CodeSymbolModel[],
    rule: ForbiddenKeywordsRule,
    projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.from.role)
    );

    // Performance: Use cache if available
    const validationPromises = symbolsToCheck.map(async (symbol) => {
      try {
        let content: string;
        if (fileCache && fileCache.has(symbol.path)) {
          content = fileCache.get(symbol.path)!;
        } else {
          const fs = await import('fs').then((m) => m.promises);
          const path = await import('path');
          const filePath = path.join(projectPath, symbol.path);
          content = await fs.readFile(filePath, 'utf-8');
        }

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
    projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.from.role)
    );

    // Performance: Use cache if available
    const validationPromises = symbolsToCheck.map(async (symbol) => {
      try {
        let content: string;
        if (fileCache && fileCache.has(symbol.path)) {
          content = fileCache.get(symbol.path)!;
        } else {
          const fs = await import('fs').then((m) => m.promises);
          const path = await import('path');
          const filePath = path.join(projectPath, symbol.path);
          content = await fs.readFile(filePath, 'utf-8');
        }

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
    projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const filePattern = new RegExp(rule.for.file_pattern);
    const symbolsToCheck = symbols.filter((symbol) => filePattern.test(symbol.path));

    // Performance: Use cache if available
    const validationPromises = symbolsToCheck.map(async (symbol) => {
      try {
        let content: string;
        if (fileCache && fileCache.has(symbol.path)) {
          content = fileCache.get(symbol.path)!;
        } else {
          const fs = await import('fs').then((m) => m.promises);
          const path = await import('path');
          const filePath = path.join(projectPath, symbol.path);
          content = await fs.readFile(filePath, 'utf-8');
        }

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

/**
 * Documentation Validator
 *
 * Validates that files meet documentation requirements.
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  DocumentationRequiredRule,
} from '../../../domain/models';
import { BaseRuleValidator } from '../base-rule.validator';

export class DocumentationValidator extends BaseRuleValidator {
  constructor(private readonly rules: DocumentationRequiredRule[]) {
    super();
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    for (const rule of this.rules) {
      violations.push(...(await this.validateDocumentation(symbols, rule, projectPath, fileCache)));
    }

    return violations;
  }

  private async validateDocumentation(
    symbols: CodeSymbolModel[],
    rule: DocumentationRequiredRule,
    projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.for.role)
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

        const lines = content.split('\n').length;

        if (lines >= rule.min_lines) {
          if (rule.requires_jsdoc && !content.includes('/**')) {
            return {
              ruleName: rule.name,
              severity: rule.severity,
              file: symbol.path,
              message: `${rule.name}: ${symbol.path} (${lines} lines) lacks JSDoc documentation${rule.comment ? ` - ${rule.comment}` : ''}`,
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
}

/**
 * File Size Validator
 *
 * Validates file size limits based on line count.
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  FileSizeRule,
} from '../../../domain/models';
import { BaseRuleValidator } from '../base-rule.validator';

export class FileSizeValidator extends BaseRuleValidator {
  constructor(private readonly rules: FileSizeRule[]) {
    super();
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    for (const rule of this.rules) {
      violations.push(...(await this.validateFileSize(symbols, rule, projectPath)));
    }

    return violations;
  }

  private async validateFileSize(
    symbols: CodeSymbolModel[],
    rule: FileSizeRule,
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
        const lines = content.split('\n').length;

        if (lines > rule.max_lines) {
          violations.push({
            ruleName: rule.name,
            severity: rule.severity,
            file: symbol.path,
            message: `${rule.name}: File ${symbol.path} has ${lines} lines (exceeds ${rule.max_lines} limit)${rule.comment ? ` - ${rule.comment}` : ''}`,
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

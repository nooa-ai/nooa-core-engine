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
import { readFileContent } from '../../helpers';

export class FileSizeValidator extends BaseRuleValidator {
  constructor(private readonly rules: FileSizeRule[]) {
    super();
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    for (const rule of this.rules) {
      violations.push(...(await this.validateFileSize(symbols, rule, projectPath, fileCache)));
    }

    return violations;
  }

  private async validateFileSize(
    symbols: CodeSymbolModel[],
    rule: FileSizeRule,
    projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.for.role)
    );

    // Performance: Use cache if available, otherwise read from disk
    const validationPromises = symbolsToCheck.map(async (symbol) => {
      const content = await readFileContent(symbol.path, projectPath, fileCache);
      if (!content) return null;

      const lines = content.split('\n').length;

      if (lines > rule.max_lines) {
        return {
          ruleName: rule.name,
          severity: rule.severity,
          file: symbol.path,
          message: `${rule.name}: File ${symbol.path} has ${lines} lines (exceeds ${rule.max_lines} limit)${rule.comment ? ` - ${rule.comment}` : ''}`,
          fromRole: symbol.role,
          toRole: undefined,
          dependency: undefined,
        };
      }
      return null;
    });

    const results = await Promise.all(validationPromises);
    return results.filter((v) => v !== null) as ArchitecturalViolationModel[];
  }
}

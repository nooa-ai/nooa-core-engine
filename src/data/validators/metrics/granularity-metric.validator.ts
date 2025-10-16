/**
 * Granularity Metric Validator
 *
 * Validates project-wide granularity metrics like average lines per file.
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  GranularityMetricRule,
} from '../../../domain/models';
import { BaseRuleValidator } from '../base-rule.validator';

export class GranularityMetricValidator extends BaseRuleValidator {
  constructor(private readonly rules: GranularityMetricRule[]) {
    super();
  }

  async validate(
    symbols: CodeSymbolModel[],
    _projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    for (const rule of this.rules) {
      violations.push(...(await this.validateGranularityMetric(symbols, rule, fileCache)));
    }

    return violations;
  }

  private async validateGranularityMetric(
    symbols: CodeSymbolModel[],
    rule: GranularityMetricRule,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    if (symbols.length === 0) {
      return violations;
    }

    let totalLines = 0;
    let fileCount = 0;

    // Read from cache (files are pre-cached by use case)
    if (fileCache) {
      for (const symbol of symbols) {
        const content = fileCache.get(symbol.path);
        if (content !== undefined) {
          const lines = content.split('\n').length;
          totalLines += lines;
          fileCount++;
        }
      }
    }

    if (fileCount === 0) {
      return violations;
    }

    const averageLinesPerFile = totalLines / fileCount;
    const targetLoc = rule.global.target_loc_per_file;
    const threshold = targetLoc * rule.global.warning_threshold_multiplier;

    if (averageLinesPerFile > threshold) {
      violations.push({
        ruleName: rule.name,
        severity: rule.severity,
        file: 'PROJECT',
        message: `${rule.name}: Average lines per file: ${Math.round(averageLinesPerFile)}, target: ${targetLoc} (threshold: ${Math.round(threshold)})${rule.comment ? ` - ${rule.comment}` : ''}`,
        fromRole: undefined,
        toRole: undefined,
        dependency: undefined,
      });
    }

    return violations;
  }
}

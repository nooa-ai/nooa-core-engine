/**
 * Structure Validator
 *
 * Validates project structure including:
 * - Required directory structure
 * - Minimum test ratio
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  RequiredStructureRule,
  MinimumTestRatioRule,
} from '../../domain/models';
import { BaseRuleValidator } from './base-rule.validator';

export class StructureValidator extends BaseRuleValidator {
  constructor(
    private readonly requiredStructureRules: RequiredStructureRule[],
    private readonly minimumTestRatioRules: MinimumTestRatioRule[]
  ) {
    super();
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    // Validate required structure
    for (const rule of this.requiredStructureRules) {
      violations.push(...(await this.validateRequiredStructure(rule, projectPath)));
    }

    // Validate minimum test ratio
    for (const rule of this.minimumTestRatioRules) {
      violations.push(...this.validateMinimumTestRatio(symbols, rule));
    }

    return violations;
  }

  private async validateRequiredStructure(
    rule: RequiredStructureRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');

    for (const requiredDir of rule.required_directories) {
      try {
        const dirPath = path.join(projectPath, requiredDir);
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          violations.push({
            ruleName: rule.name,
            severity: rule.severity,
            file: requiredDir,
            message: `${rule.name}: Required directory '${requiredDir}' does not exist${rule.comment ? ` - ${rule.comment}` : ''}`,
            fromRole: undefined,
            toRole: undefined,
            dependency: undefined,
          });
        }
      } catch {
        violations.push({
          ruleName: rule.name,
          severity: rule.severity,
          file: requiredDir,
          message: `${rule.name}: Required directory '${requiredDir}' does not exist${rule.comment ? ` - ${rule.comment}` : ''}`,
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        });
      }
    }

    return violations;
  }

  private validateMinimumTestRatio(
    symbols: CodeSymbolModel[],
    rule: MinimumTestRatioRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    // Classify files as test or production
    const testFiles = symbols.filter(
      (symbol) =>
        symbol.path.includes('.spec.') ||
        symbol.path.includes('.test.') ||
        symbol.path.startsWith('tests/') ||
        symbol.path.startsWith('test/')
    );

    const productionFiles = symbols.filter(
      (symbol) =>
        !symbol.path.includes('.spec.') &&
        !symbol.path.includes('.test.') &&
        !symbol.path.startsWith('tests/') &&
        !symbol.path.startsWith('test/')
    );

    if (productionFiles.length === 0) {
      return violations;
    }

    const currentRatio = testFiles.length / productionFiles.length;
    const requiredRatio = rule.global.test_ratio;

    if (currentRatio < requiredRatio) {
      violations.push({
        ruleName: rule.name,
        severity: rule.severity,
        file: 'PROJECT',
        message: `${rule.name}: Test ratio is ${currentRatio.toFixed(2)} (${testFiles.length} test files / ${productionFiles.length} production files), minimum required: ${requiredRatio}${rule.comment ? ` - ${rule.comment}` : ''}`,
        fromRole: undefined,
        toRole: undefined,
        dependency: undefined,
      });
    }

    return violations;
  }
}

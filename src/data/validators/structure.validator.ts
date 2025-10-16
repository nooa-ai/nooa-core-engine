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
import { IFileExistenceChecker } from '../protocols';

export class StructureValidator extends BaseRuleValidator {
  constructor(
    private readonly requiredStructureRules: RequiredStructureRule[],
    private readonly minimumTestRatioRules: MinimumTestRatioRule[],
    private readonly fileExistenceChecker: IFileExistenceChecker
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

    for (const requiredDir of rule.required_directories) {
      const dirPath = `${projectPath}/${requiredDir}`.replace(/\/+/g, '/');

      if (!this.fileExistenceChecker.existsSync(dirPath)) {
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

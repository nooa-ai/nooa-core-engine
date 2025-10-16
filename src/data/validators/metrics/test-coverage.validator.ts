/**
 * Test Coverage Validator
 *
 * Validates that files have corresponding test files.
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  TestCoverageRule,
} from '../../../domain/models';
import { BaseRuleValidator } from '../base-rule.validator';

export class TestCoverageValidator extends BaseRuleValidator {
  constructor(private readonly rules: TestCoverageRule[]) {
    super();
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    for (const rule of this.rules) {
      violations.push(...(await this.validateTestCoverage(symbols, rule, projectPath)));
    }

    return violations;
  }

  private async validateTestCoverage(
    symbols: CodeSymbolModel[],
    rule: TestCoverageRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');

    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.from.role)
    );

    for (const symbol of symbolsToCheck) {
      const testPatterns = [
        symbol.path.replace(/\.ts$/, '.spec.ts'),
        symbol.path.replace(/\.ts$/, '.test.ts'),
        symbol.path.replace(/^src\//, 'tests/').replace(/\.ts$/, '.spec.ts'),
        symbol.path.replace(/^src\//, 'tests/').replace(/\.ts$/, '.test.ts'),
      ];

      let hasTest = false;
      for (const testPath of testPatterns) {
        try {
          const fullPath = path.join(projectPath, testPath);
          await fs.access(fullPath);
          hasTest = true;
          break;
        } catch {
          // Test file doesn't exist, continue checking
        }
      }

      if (!hasTest) {
        violations.push({
          ruleName: rule.name,
          severity: rule.severity,
          file: symbol.path,
          message: `${rule.name}: ${symbol.path} has no corresponding test file${rule.comment ? ` - ${rule.comment}` : ''}`,
          fromRole: symbol.role,
          toRole: undefined,
          dependency: undefined,
        });
      }
    }

    return violations;
  }
}

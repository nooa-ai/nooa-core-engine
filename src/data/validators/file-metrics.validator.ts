/**
 * File Metrics Validator
 *
 * Validates file-level metrics including:
 * - File size limits
 * - Test coverage
 * - Documentation requirements
 * - Class complexity
 * - Granularity metrics
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  FileSizeRule,
  TestCoverageRule,
  DocumentationRequiredRule,
  ClassComplexityRule,
  GranularityMetricRule,
} from '../../domain/models';
import { BaseRuleValidator } from './base-rule.validator';

export class FileMetricsValidator extends BaseRuleValidator {
  constructor(
    private readonly fileSizeRules: FileSizeRule[],
    private readonly testCoverageRules: TestCoverageRule[],
    private readonly documentationRules: DocumentationRequiredRule[],
    private readonly classComplexityRules: ClassComplexityRule[],
    private readonly granularityRules: GranularityMetricRule[]
  ) {
    super();
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    // Validate file size
    for (const rule of this.fileSizeRules) {
      violations.push(...(await this.validateFileSize(symbols, rule, projectPath)));
    }

    // Validate test coverage
    for (const rule of this.testCoverageRules) {
      violations.push(...(await this.validateTestCoverage(symbols, rule, projectPath)));
    }

    // Validate documentation
    for (const rule of this.documentationRules) {
      violations.push(...(await this.validateDocumentation(symbols, rule, projectPath)));
    }

    // Validate class complexity
    for (const rule of this.classComplexityRules) {
      violations.push(...(await this.validateClassComplexity(symbols, rule, projectPath)));
    }

    // Validate granularity metrics
    for (const rule of this.granularityRules) {
      violations.push(...(await this.validateGranularityMetric(symbols, rule, projectPath)));
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

  private async validateDocumentation(
    symbols: CodeSymbolModel[],
    rule: DocumentationRequiredRule,
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

        if (lines >= rule.min_lines) {
          if (rule.requires_jsdoc && !content.includes('/**')) {
            violations.push({
              ruleName: rule.name,
              severity: rule.severity,
              file: symbol.path,
              message: `${rule.name}: ${symbol.path} (${lines} lines) lacks JSDoc documentation${rule.comment ? ` - ${rule.comment}` : ''}`,
              fromRole: symbol.role,
              toRole: undefined,
              dependency: undefined,
            });
          }
        }
      } catch (error) {
        // File might not exist or be readable, skip
      }
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

  private async validateGranularityMetric(
    symbols: CodeSymbolModel[],
    rule: GranularityMetricRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');

    if (symbols.length === 0) {
      return violations;
    }

    let totalLines = 0;
    let fileCount = 0;

    for (const symbol of symbols) {
      try {
        const filePath = path.join(projectPath, symbol.path);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').length;
        totalLines += lines;
        fileCount++;
      } catch (error) {
        // File might not exist or be readable, skip
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

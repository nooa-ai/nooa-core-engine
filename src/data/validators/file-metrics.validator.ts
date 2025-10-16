/**
 * File Metrics Validator (Coordinator)
 *
 * Coordinates validation of file-level metrics by delegating to specialized validators:
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
import {
  FileSizeValidator,
  TestCoverageValidator,
  DocumentationValidator,
  ClassComplexityValidator,
  GranularityMetricValidator,
} from './metrics';

export class FileMetricsValidator extends BaseRuleValidator {
  private readonly fileSizeValidator: FileSizeValidator;
  private readonly testCoverageValidator: TestCoverageValidator;
  private readonly documentationValidator: DocumentationValidator;
  private readonly classComplexityValidator: ClassComplexityValidator;
  private readonly granularityMetricValidator: GranularityMetricValidator;

  constructor(
    fileSizeRules: FileSizeRule[],
    testCoverageRules: TestCoverageRule[],
    documentationRules: DocumentationRequiredRule[],
    classComplexityRules: ClassComplexityRule[],
    granularityRules: GranularityMetricRule[]
  ) {
    super();
    this.fileSizeValidator = new FileSizeValidator(fileSizeRules);
    this.testCoverageValidator = new TestCoverageValidator(testCoverageRules);
    this.documentationValidator = new DocumentationValidator(documentationRules);
    this.classComplexityValidator = new ClassComplexityValidator(classComplexityRules);
    this.granularityMetricValidator = new GranularityMetricValidator(granularityRules);
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    // Run all validators in parallel (performance optimization)
    const results = await Promise.all([
      this.fileSizeValidator.validate(symbols, projectPath, fileCache),
      this.testCoverageValidator.validate(symbols, projectPath),
      this.documentationValidator.validate(symbols, projectPath, fileCache),
      this.classComplexityValidator.validate(symbols, projectPath),
      this.granularityMetricValidator.validate(symbols, projectPath),
    ]);

    return results.flat();
  }
}

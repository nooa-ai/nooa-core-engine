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
import { IFileExistenceChecker } from '../protocols';

export class FileMetricsValidator extends BaseRuleValidator {
  private readonly fileSizeValidator?: FileSizeValidator;
  private readonly testCoverageValidator?: TestCoverageValidator;
  private readonly documentationValidator?: DocumentationValidator;
  private readonly classComplexityValidator?: ClassComplexityValidator;
  private readonly granularityMetricValidator?: GranularityMetricValidator;

  constructor(
    fileSizeRules: FileSizeRule[],
    testCoverageRules: TestCoverageRule[],
    documentationRules: DocumentationRequiredRule[],
    classComplexityRules: ClassComplexityRule[],
    granularityRules: GranularityMetricRule[],
    fileExistenceChecker: IFileExistenceChecker
  ) {
    super();
    // Only create validators when rules exist (performance optimization)
    this.fileSizeValidator = fileSizeRules.length > 0 ? new FileSizeValidator(fileSizeRules) : undefined;
    this.testCoverageValidator = testCoverageRules.length > 0 ? new TestCoverageValidator(testCoverageRules, fileExistenceChecker) : undefined;
    this.documentationValidator = documentationRules.length > 0 ? new DocumentationValidator(documentationRules) : undefined;
    this.classComplexityValidator = classComplexityRules.length > 0 ? new ClassComplexityValidator(classComplexityRules, fileExistenceChecker) : undefined;
    this.granularityMetricValidator = granularityRules.length > 0 ? new GranularityMetricValidator(granularityRules) : undefined;
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const validationPromises: Promise<ArchitecturalViolationModel[]>[] = [];

    // Only run validators that were created (performance optimization)
    if (this.fileSizeValidator) {
      validationPromises.push(this.fileSizeValidator.validate(symbols, projectPath, fileCache));
    }
    if (this.testCoverageValidator) {
      validationPromises.push(this.testCoverageValidator.validate(symbols, projectPath));
    }
    if (this.documentationValidator) {
      validationPromises.push(this.documentationValidator.validate(symbols, projectPath, fileCache));
    }
    if (this.classComplexityValidator) {
      validationPromises.push(this.classComplexityValidator.validate(symbols, projectPath));
    }
    if (this.granularityMetricValidator) {
      validationPromises.push(this.granularityMetricValidator.validate(symbols, projectPath, fileCache));
    }

    if (validationPromises.length === 0) {
      return [];
    }

    const results = await Promise.all(validationPromises);
    return results.flat();
  }
}

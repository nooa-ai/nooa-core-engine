/**
 * Helper: Validator Orchestrator
 *
 * Responsible for orchestrating all validators and collecting violations.
 * Runs validators in parallel for better performance and deduplicates results.
 *
 * Performance optimization: Uses Promise.all() for parallel validation.
 *
 * Following Single Responsibility Principle: Only handles validator orchestration.
 */

import { ArchitecturalViolationModel, CodeSymbolModel, GrammarModel } from '../../domain/models';
import { IFileExistenceChecker } from '../protocols';
import { NamingPatternValidator } from '../validators/naming-pattern.validator';
import { DependencyValidator } from '../validators/dependency.validator';
import { HygieneValidator } from '../validators/hygiene.validator';
import { FileMetricsValidator } from '../validators/file-metrics.validator';
import { CodePatternValidator } from '../validators/code-pattern.validator';
import { StructureValidator } from '../validators/structure.validator';
import { ViolationDeduplicatorHelper } from './violation-deduplicator.helper';
import { RuleExtractorHelper } from './rule-extractor.helper';

export class ValidatorOrchestratorHelper {
  private readonly deduplicator: ViolationDeduplicatorHelper;
  private readonly ruleExtractor: RuleExtractorHelper;

  constructor(private readonly fileExistenceChecker: IFileExistenceChecker) {
    this.deduplicator = new ViolationDeduplicatorHelper();
    this.ruleExtractor = new RuleExtractorHelper();
  }

  /**
   * Validates architectural dependencies and detects violations
   *
   * @param symbols - Code symbols with assigned roles
   * @param grammar - Grammar configuration with rules
   * @param projectPath - Project path for file system operations
   * @param fileCache - Cached file contents (eliminates redundant I/O)
   * @returns Array of architectural violations
   */
  async orchestrate(
    symbols: CodeSymbolModel[],
    grammar: GrammarModel,
    projectPath: string,
    fileCache: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const rules = this.ruleExtractor.extract(grammar.rules);

    // Early return if no rules defined
    const hasRules = Object.values(rules).some((ruleArray) => ruleArray.length > 0);
    if (!hasRules) {
      return [];
    }

    const validationPromises: Promise<ArchitecturalViolationModel[]>[] = [];

    // Run all validators in parallel (performance optimization)
    if (rules.namingPatternRules.length > 0) {
      const validator = new NamingPatternValidator(rules.namingPatternRules);
      validationPromises.push(validator.validate(symbols, projectPath));
    }

    if (rules.dependencyRules.length > 0) {
      const validator = new DependencyValidator(rules.dependencyRules);
      validationPromises.push(validator.validate(symbols, projectPath));
    }

    if (rules.synonymRules.length > 0 || rules.unreferencedRules.length > 0) {
      const validator = new HygieneValidator(rules.synonymRules, rules.unreferencedRules);
      validationPromises.push(validator.validate(symbols, projectPath));
    }

    if (
      rules.fileSizeRules.length > 0 ||
      rules.testCoverageRules.length > 0 ||
      rules.documentationRules.length > 0 ||
      rules.classComplexityRules.length > 0 ||
      rules.granularityMetricRules.length > 0
    ) {
      const validator = new FileMetricsValidator(
        rules.fileSizeRules,
        rules.testCoverageRules,
        rules.documentationRules,
        rules.classComplexityRules,
        rules.granularityMetricRules,
        this.fileExistenceChecker
      );
      validationPromises.push(validator.validate(symbols, projectPath, fileCache));
    }

    if (
      rules.forbiddenKeywordsRules.length > 0 ||
      rules.forbiddenPatternsRules.length > 0 ||
      rules.barrelPurityRules.length > 0
    ) {
      const validator = new CodePatternValidator(
        rules.forbiddenKeywordsRules,
        rules.forbiddenPatternsRules,
        rules.barrelPurityRules
      );
      validationPromises.push(validator.validate(symbols, projectPath, fileCache));
    }

    if (rules.requiredStructureRules.length > 0 || rules.minimumTestRatioRules.length > 0) {
      const validator = new StructureValidator(
        rules.requiredStructureRules,
        rules.minimumTestRatioRules,
        this.fileExistenceChecker
      );
      validationPromises.push(validator.validate(symbols, projectPath));
    }

    // Early return if no validators to run
    if (validationPromises.length === 0) {
      return [];
    }

    // Wait for all validators to complete in parallel
    const results = await Promise.all(validationPromises);
    const violations = results.flat();

    // Only deduplicate if we have violations
    if (violations.length === 0) {
      return violations;
    }

    return this.deduplicator.deduplicate(violations);
  }
}

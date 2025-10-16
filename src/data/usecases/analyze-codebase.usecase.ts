/**
 * Use Case Implementation: Analyze Codebase
 *
 * This class implements the business logic for architectural validation.
 * It orchestrates the parsing of code, loading of grammar, and violation detection.
 *
 * Following Clean Architecture principles:
 * - Implements the IAnalyzeCodebase interface from Domain
 * - Depends on abstractions (protocols) not concretions
 * - Contains the core application logic
 * - Has no knowledge of infrastructure details (databases, file systems, etc.)
 *
 * Refactored in v1.4.0 to apply Extract Class pattern:
 * - Extracted FileCacheBuilderHelper (file caching logic)
 * - Extracted RoleAssignmentHelper (role assignment logic)
 * - Orchestration remains in use case (following Clean Architecture guidelines)
 */

import { IAnalyzeCodebase } from '../../domain/usecases';
import { ArchitecturalViolationModel, CodeSymbolModel, GrammarModel } from '../../domain/models';
import { ICodeParser, IGrammarRepository, IFileReader, IFileExistenceChecker } from '../protocols';
import {
  FileCacheBuilderHelper,
  RoleAssignmentHelper,
  ViolationDeduplicatorHelper,
  RuleExtractorHelper,
} from '../helpers';
import {
  NamingPatternValidator,
  DependencyValidator,
  HygieneValidator,
  FileMetricsValidator,
  CodePatternValidator,
  StructureValidator,
} from '../validators';

/**
 * Implementation of the Analyze Codebase use case
 */
export class AnalyzeCodebaseUseCase implements IAnalyzeCodebase {
  private readonly fileCacheBuilder: FileCacheBuilderHelper;
  private readonly roleAssignment: RoleAssignmentHelper;
  private readonly deduplicator: ViolationDeduplicatorHelper;
  private readonly ruleExtractor: RuleExtractorHelper;

  /**
   * Constructor with dependency injection
   * All dependencies are abstractions (interfaces), enabling testability and flexibility
   *
   * @param codeParser - Protocol for parsing source code
   * @param grammarRepository - Protocol for loading grammar configuration
   * @param fileReader - Protocol for reading file contents (Dependency Inversion)
   * @param fileExistenceChecker - Protocol for checking file existence (ISP compliance)
   * Note: Same adapter instance can be passed for both fileReader and fileExistenceChecker
   */
  constructor(
    private readonly codeParser: ICodeParser,
    private readonly grammarRepository: IGrammarRepository,
    fileReader: IFileReader,
    private readonly fileExistenceChecker: IFileExistenceChecker
  ) {
    this.fileCacheBuilder = new FileCacheBuilderHelper(fileReader);
    this.roleAssignment = new RoleAssignmentHelper();
    this.deduplicator = new ViolationDeduplicatorHelper();
    this.ruleExtractor = new RuleExtractorHelper();
  }

  /**
   * Analyzes a codebase for architectural violations
   *
   * Algorithm:
   * 1. Load the grammar configuration
   * 2. Parse the codebase to extract symbols
   * 3. Assign roles to symbols based on path patterns
   * 4. Cache file contents in memory (performance optimization)
   * 5. Extract and orchestrate validators based on rules
   * 6. Return deduplicated violations
   *
   * Performance: Runs validators in parallel using Promise.all()
   */
  async analyze(params: IAnalyzeCodebase.Params): Promise<IAnalyzeCodebase.Result> {
    const { projectPath } = params;

    // Steps 1-4: Load, parse, assign roles, and cache files
    const grammar = await this.grammarRepository.load(projectPath);
    const symbols = await this.codeParser.parse(projectPath);
    const symbolsWithRoles = this.roleAssignment.assign(symbols, grammar);
    const fileCache = this.fileCacheBuilder.build(symbolsWithRoles, projectPath);

    // Step 5: Orchestrate validators
    const violations = await this.orchestrateValidators(
      symbolsWithRoles,
      grammar,
      projectPath,
      fileCache
    );

    return violations;
  }

  /**
   * Orchestrates all validators based on defined rules
   * Creates validators only for rules that exist, runs them in parallel
   *
   * @param symbols - Code symbols with assigned roles
   * @param grammar - Grammar configuration
   * @param projectPath - Project root path
   * @param fileCache - Cached file contents
   * @returns Deduplicated architectural violations
   */
  private async orchestrateValidators(
    symbols: CodeSymbolModel[],
    grammar: GrammarModel,
    projectPath: string,
    fileCache: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const rules = this.ruleExtractor.extract(grammar.rules);

    // Early return if no rules
    const hasRules = Object.values(rules).some((ruleArray) => ruleArray.length > 0);
    if (!hasRules) return [];

    const validationPromises: Promise<ArchitecturalViolationModel[]>[] = [];

    // Create validators conditionally based on rules (avoids unnecessary instantiation)
    if (rules.namingPatternRules.length > 0) {
      validationPromises.push(
        new NamingPatternValidator(rules.namingPatternRules).validate(symbols, projectPath)
      );
    }

    if (rules.dependencyRules.length > 0) {
      validationPromises.push(
        new DependencyValidator(rules.dependencyRules).validate(symbols, projectPath)
      );
    }

    if (rules.synonymRules.length > 0 || rules.unreferencedRules.length > 0) {
      validationPromises.push(
        new HygieneValidator(rules.synonymRules, rules.unreferencedRules).validate(symbols, projectPath)
      );
    }

    if (
      rules.fileSizeRules.length > 0 ||
      rules.testCoverageRules.length > 0 ||
      rules.documentationRules.length > 0 ||
      rules.classComplexityRules.length > 0 ||
      rules.granularityMetricRules.length > 0
    ) {
      validationPromises.push(
        new FileMetricsValidator(
          rules.fileSizeRules,
          rules.testCoverageRules,
          rules.documentationRules,
          rules.classComplexityRules,
          rules.granularityMetricRules,
          this.fileExistenceChecker
        ).validate(symbols, projectPath, fileCache)
      );
    }

    if (
      rules.forbiddenKeywordsRules.length > 0 ||
      rules.forbiddenPatternsRules.length > 0 ||
      rules.barrelPurityRules.length > 0
    ) {
      validationPromises.push(
        new CodePatternValidator(
          rules.forbiddenKeywordsRules,
          rules.forbiddenPatternsRules,
          rules.barrelPurityRules
        ).validate(symbols, projectPath, fileCache)
      );
    }

    if (rules.requiredStructureRules.length > 0 || rules.minimumTestRatioRules.length > 0) {
      validationPromises.push(
        new StructureValidator(
          rules.requiredStructureRules,
          rules.minimumTestRatioRules,
          this.fileExistenceChecker
        ).validate(symbols, projectPath)
      );
    }

    if (validationPromises.length === 0) return [];

    // Run all validators in parallel and deduplicate
    const results = await Promise.all(validationPromises);
    const violations = results.flat();

    return violations.length > 0 ? this.deduplicator.deduplicate(violations) : violations;
  }
}

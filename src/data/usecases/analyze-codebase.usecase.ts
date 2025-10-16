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
 */

import { IAnalyzeCodebase } from '../../domain/usecases';
import { ArchitecturalViolationModel, CodeSymbolModel, GrammarModel } from '../../domain/models';
import { ICodeParser, IGrammarRepository } from '../protocols';
import {
  NamingPatternValidator,
  DependencyValidator,
  HygieneValidator,
  FileMetricsValidator,
  CodePatternValidator,
  StructureValidator,
} from '../validators';
import {
  ViolationDeduplicatorHelper,
  RuleExtractorHelper,
} from '../helpers';

/**
 * Implementation of the Analyze Codebase use case
 */
export class AnalyzeCodebaseUseCase implements IAnalyzeCodebase {
  private readonly deduplicator: ViolationDeduplicatorHelper;
  private readonly ruleExtractor: RuleExtractorHelper;

  /**
   * Constructor with dependency injection
   * All dependencies are abstractions (interfaces), enabling testability and flexibility
   *
   * @param codeParser - Protocol for parsing source code
   * @param grammarRepository - Protocol for loading grammar configuration
   */
  constructor(
    private readonly codeParser: ICodeParser,
    private readonly grammarRepository: IGrammarRepository
  ) {
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
   * 5. Validate dependencies against architectural rules
   * 6. Return all violations found
   */
  async analyze(params: IAnalyzeCodebase.Params): Promise<IAnalyzeCodebase.Result> {
    const { projectPath } = params;

    // Step 1: Load grammar configuration
    const grammar = await this.grammarRepository.load(projectPath);

    // Step 2: Parse codebase
    const symbols = await this.codeParser.parse(projectPath);

    // Step 3: Assign roles to symbols
    const symbolsWithRoles = this.assignRolesToSymbols(symbols, grammar);

    // Step 4: Cache all file contents in memory (eliminates redundant I/O)
    const fileCache = await this.buildFileCache(symbolsWithRoles, projectPath);

    // Step 5: Validate architecture and collect violations
    const violations = await this.validateArchitecture(symbolsWithRoles, grammar, projectPath, fileCache);

    return violations;
  }

  /**
   * Builds cache of file contents in memory
   *
   * Performance: Read all files once and cache in Map to eliminate redundant I/O.
   * Multiple validators need the same file content, so we read once and share.
   *
   * @param symbols - Code symbols with file paths
   * @param projectPath - Root project path
   * @returns Map of filePath → fileContent
   */
  private async buildFileCache(
    symbols: CodeSymbolModel[],
    projectPath: string
  ): Promise<Map<string, string>> {
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');
    const fileCache = new Map<string, string>();

    // Get unique file paths
    const uniqueFilePaths = [...new Set(symbols.map((s) => s.path))];

    // Read all files in parallel
    await Promise.all(
      uniqueFilePaths.map(async (symbolPath) => {
        try {
          const fullPath = path.join(projectPath, symbolPath);
          const content = await fs.readFile(fullPath, 'utf-8');
          fileCache.set(symbolPath, content);
        } catch (error) {
          // File might not exist or be readable, skip (cache miss handled by validators)
        }
      })
    );

    return fileCache;
  }

  /**
   * Assigns architectural roles to code symbols based on path patterns
   *
   * Performance: Compiles regex patterns once and reuses them for all symbols
   *
   * @param symbols - Code symbols extracted from the codebase
   * @param grammar - Grammar configuration with role definitions
   * @returns Symbols with assigned roles
   */
  private assignRolesToSymbols(
    symbols: CodeSymbolModel[],
    grammar: GrammarModel
  ): CodeSymbolModel[] {
    // Compile regex patterns once (performance optimization)
    const rolesWithPatterns = grammar.roles.map((role) => ({
      name: role.name,
      pattern: new RegExp(role.path),
    }));

    return symbols.map((symbol) => {
      // Find the first role whose path pattern matches the symbol's path
      const matchingRole = rolesWithPatterns.find((role) =>
        role.pattern.test(symbol.path)
      );

      return {
        ...symbol,
        role: matchingRole?.name || 'UNKNOWN',
      };
    });
  }

  /**
   * Validates architectural dependencies and detects violations
   *
   * Performance: Runs validators in parallel using Promise.all()
   * Optimization: Only creates and runs validators when rules exist
   *
   * @param symbols - Code symbols with assigned roles
   * @param grammar - Grammar configuration with rules
   * @param projectPath - Project path for file system operations
   * @param fileCache - Cached file contents (eliminates redundant I/O)
   * @returns Array of architectural violations
   */
  private async validateArchitecture(
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
        rules.granularityMetricRules
      );
      // Pass fileCache to eliminate redundant file reads
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
      // Pass fileCache to eliminate redundant file reads
      validationPromises.push(validator.validate(symbols, projectPath, fileCache));
    }

    if (rules.requiredStructureRules.length > 0 || rules.minimumTestRatioRules.length > 0) {
      const validator = new StructureValidator(
        rules.requiredStructureRules,
        rules.minimumTestRatioRules
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

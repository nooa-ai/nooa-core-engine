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
   * 4. Validate dependencies against architectural rules
   * 5. Return all violations found
   */
  async analyze(params: IAnalyzeCodebase.Params): Promise<IAnalyzeCodebase.Result> {
    const { projectPath } = params;

    // Step 1: Load grammar configuration
    const grammar = await this.grammarRepository.load(projectPath);

    // Step 2: Parse codebase
    const symbols = await this.codeParser.parse(projectPath);

    // Step 3: Assign roles to symbols
    const symbolsWithRoles = this.assignRolesToSymbols(symbols, grammar);

    // Step 4: Validate architecture and collect violations
    const violations = await this.validateArchitecture(symbolsWithRoles, grammar, projectPath);

    return violations;
  }

  /**
   * Assigns architectural roles to code symbols based on path patterns
   *
   * @param symbols - Code symbols extracted from the codebase
   * @param grammar - Grammar configuration with role definitions
   * @returns Symbols with assigned roles
   */
  private assignRolesToSymbols(
    symbols: CodeSymbolModel[],
    grammar: GrammarModel
  ): CodeSymbolModel[] {
    return symbols.map((symbol) => {
      // Find the first role whose path pattern matches the symbol's path
      const matchingRole = grammar.roles.find((role) => {
        const pattern = new RegExp(role.path);
        return pattern.test(symbol.path);
      });

      return {
        ...symbol,
        role: matchingRole?.name || 'UNKNOWN',
      };
    });
  }

  /**
   * Validates architectural dependencies and detects violations
   *
   * @param symbols - Code symbols with assigned roles
   * @param grammar - Grammar configuration with rules
   * @param projectPath - Project path for file system operations
   * @returns Array of architectural violations
   */
  private async validateArchitecture(
    symbols: CodeSymbolModel[],
    grammar: GrammarModel,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const rules = this.ruleExtractor.extract(grammar.rules);

    // Validate using specialized validators
    if (rules.namingPatternRules.length > 0) {
      const validator = new NamingPatternValidator(rules.namingPatternRules);
      violations.push(...(await validator.validate(symbols, projectPath)));
    }

    if (rules.dependencyRules.length > 0) {
      const validator = new DependencyValidator(rules.dependencyRules);
      violations.push(...(await validator.validate(symbols, projectPath)));
    }

    if (rules.synonymRules.length > 0 || rules.unreferencedRules.length > 0) {
      const validator = new HygieneValidator(rules.synonymRules, rules.unreferencedRules);
      violations.push(...(await validator.validate(symbols, projectPath)));
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
      violations.push(...(await validator.validate(symbols, projectPath)));
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
      violations.push(...(await validator.validate(symbols, projectPath)));
    }

    if (rules.requiredStructureRules.length > 0 || rules.minimumTestRatioRules.length > 0) {
      const validator = new StructureValidator(
        rules.requiredStructureRules,
        rules.minimumTestRatioRules
      );
      violations.push(...(await validator.validate(symbols, projectPath)));
    }

    return this.deduplicator.deduplicate(violations);
  }
}

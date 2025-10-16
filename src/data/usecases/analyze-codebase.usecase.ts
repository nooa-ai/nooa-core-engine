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
 * - Extracted ValidatorOrchestratorHelper (validator orchestration)
 * - Use case now acts as pure coordinator (<100 LOC)
 */

import { IAnalyzeCodebase } from '../../domain/usecases';
import { ICodeParser, IGrammarRepository, IFileReader, IFileExistenceChecker } from '../protocols';
import {
  FileCacheBuilderHelper,
  RoleAssignmentHelper,
} from '../helpers';
import { ValidatorOrchestratorHelper } from '../helpers/validator-orchestrator.helper';

/**
 * Implementation of the Analyze Codebase use case
 */
export class AnalyzeCodebaseUseCase implements IAnalyzeCodebase {
  private readonly fileCacheBuilder: FileCacheBuilderHelper;
  private readonly roleAssignment: RoleAssignmentHelper;
  private readonly validatorOrchestrator: ValidatorOrchestratorHelper;

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
    fileExistenceChecker: IFileExistenceChecker
  ) {
    this.fileCacheBuilder = new FileCacheBuilderHelper(fileReader);
    this.roleAssignment = new RoleAssignmentHelper();
    this.validatorOrchestrator = new ValidatorOrchestratorHelper(fileExistenceChecker);
  }

  /**
   * Analyzes a codebase for architectural violations
   *
   * Algorithm:
   * 1. Load the grammar configuration
   * 2. Parse the codebase to extract symbols
   * 3. Assign roles to symbols based on path patterns
   * 4. Cache file contents in memory (performance optimization)
   * 5. Orchestrate validators to detect violations
   * 6. Return all violations found
   *
   * Performance: Runs validators in parallel using Promise.all()
   */
  async analyze(params: IAnalyzeCodebase.Params): Promise<IAnalyzeCodebase.Result> {
    const { projectPath } = params;

    // Step 1: Load grammar configuration
    const grammar = await this.grammarRepository.load(projectPath);

    // Step 2: Parse codebase
    const symbols = await this.codeParser.parse(projectPath);

    // Step 3: Assign roles to symbols
    const symbolsWithRoles = this.roleAssignment.assign(symbols, grammar);

    // Step 4: Cache all file contents in memory (eliminates redundant I/O)
    const fileCache = this.fileCacheBuilder.build(symbolsWithRoles, projectPath);

    // Step 5: Orchestrate validators and collect violations
    const violations = await this.validatorOrchestrator.orchestrate(
      symbolsWithRoles,
      grammar,
      projectPath,
      fileCache
    );

    return violations;
  }
}

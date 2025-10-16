/**
 * Presentation Controller: CLI Controller
 *
 * This controller is the interface between the outside world (CLI) and our application.
 * It handles user input, calls the use case, and presents the results.
 *
 * Following Clean Architecture principles:
 * - Lives in the Presentation layer
 * - Depends only on Domain interfaces (IAnalyzeCodebase)
 * - Handles input/output formatting
 * - Contains no business logic
 */

import { IAnalyzeCodebase } from '../../domain/usecases';
import { IValidation } from '../../validation/protocols';
import { ICommandLineAdapter } from '../protocols/command-line-adapter';
import { CliViolationPresenter } from '../presenters/cli-violation.presenter';

/**
 * CLI Controller for the Nooa architectural analysis tool
 */
export class CliController {
  /**
   * Constructor with dependency injection
   *
   * @param analyzeCodebase - The use case for analyzing codebases
   * @param validator - Validates CLI arguments before handling
   * @param commandLine - Adapter for command-line operations (args, env, exit)
   * @param presenter - Presenter for formatting CLI output
   */
  constructor(
    private readonly analyzeCodebase: IAnalyzeCodebase,
    private readonly validator: IValidation,
    private readonly commandLine: ICommandLineAdapter,
    private readonly presenter: CliViolationPresenter,
  ) {}

  /**
   * Handles the CLI command execution
   */
  async handle(): Promise<void> {
    try {
      // Get command line arguments
      const args = this.commandLine.getArgs();

      // Check CLI arguments
      const checkResult = this.validator.check({ args });

      // Display usage if check fails
      if (!checkResult.success) {
        this.presenter.displayUsage();
        console.log('');
        console.error('❌ Input errors:');
        checkResult.errors.forEach((error) => {
          console.error(`  • ${error.message}`);
        });
        this.commandLine.exit(1);
        return;
      }

      // Get project path from arguments (already checked)
      const projectPath = args[0];

      console.log('🔍 Nooa Core Engine - Architectural Analysis');
      console.log('='.repeat(50));
      console.log(`📁 Analyzing project: ${projectPath}`);
      console.log('');

      // Execute the analysis with timing
      const startTime = Date.now();
      const violations = await this.analyzeCodebase.analyze({ projectPath });
      const endTime = Date.now();
      const elapsedMs = endTime - startTime;

      // Display results
      this.presenter.displayResults(violations, elapsedMs);

      // Exit with appropriate code
      const hasErrors = violations.some((v) => v.severity === 'error');
      this.commandLine.exit(hasErrors ? 1 : 0);
    } catch (error) {
      // Handle errors gracefully
      this.presenter.displayError(error);
      this.commandLine.exit(1);
    }
  }
}

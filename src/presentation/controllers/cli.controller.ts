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
import { ArchitecturalViolationModel } from '../../domain/models';

/**
 * CLI Controller for the Nooa architectural analysis tool
 */
export class CliController {
  /**
   * Constructor with dependency injection
   *
   * @param analyzeCodebase - The use case for analyzing codebases
   */
  constructor(private readonly analyzeCodebase: IAnalyzeCodebase) {}

  /**
   * Handles the CLI command execution
   *
   * @param process - Node.js process object (for accessing argv and exit)
   */
  async handle(process: NodeJS.Process): Promise<void> {
    try {
      // Parse command line arguments
      const args = process.argv.slice(2);

      // Display usage if no arguments
      if (args.length === 0) {
        this.displayUsage();
        process.exit(0);
      }

      // Get project path from arguments
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
      this.displayResults(violations, elapsedMs);

      // Exit with appropriate code
      const hasErrors = violations.some((v) => v.severity === 'error');
      process.exit(hasErrors ? 1 : 0);
    } catch (error) {
      // Handle errors gracefully
      this.displayError(error);
      process.exit(1);
    }
  }

  /**
   * Displays usage information
   */
  private displayUsage(): void {
    console.log('Nooa Core Engine - Architectural Grammar Validator');
    console.log('');
    console.log('Usage:');
    console.log('  npm start <project-path>');
    console.log('');
    console.log('Example:');
    console.log('  npm start ./my-project');
    console.log('');
    console.log('The project must contain a nooa.grammar.yaml file at its root.');
  }

  /**
   * Displays analysis results
   *
   * @param violations - Array of architectural violations found
   * @param elapsedMs - Time taken for analysis in milliseconds
   */
  private displayResults(violations: ArchitecturalViolationModel[], elapsedMs: number): void {
    if (violations.length === 0) {
      console.log('✅ No architectural violations found!');
      console.log('');
      console.log('Your codebase perfectly follows the defined architectural rules.');
      console.log('');
      this.displayMetrics(violations, elapsedMs);
      return;
    }

    console.log(`❌ Found ${violations.length} architectural violation(s):`);
    console.log('');

    // Group violations by severity
    const errors = violations.filter((v) => v.severity === 'error');
    const warnings = violations.filter((v) => v.severity === 'warning');
    const infos = violations.filter((v) => v.severity === 'info');

    // Display errors
    if (errors.length > 0) {
      console.log(`🔴 ERRORS (${errors.length}):`);
      errors.forEach((violation, index) => {
        this.displayViolation(violation, index + 1);
      });
      console.log('');
    }

    // Display warnings
    if (warnings.length > 0) {
      console.log(`🟡 WARNINGS (${warnings.length}):`);
      warnings.forEach((violation, index) => {
        this.displayViolation(violation, index + 1);
      });
      console.log('');
    }

    // Display infos
    if (infos.length > 0) {
      console.log(`🔵 INFO (${infos.length}):`);
      infos.forEach((violation, index) => {
        this.displayViolation(violation, index + 1);
      });
      console.log('');
    }

    // Summary
    console.log('='.repeat(50));
    console.log(`Summary: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info`);
    console.log('');
    this.displayMetrics(violations, elapsedMs);
  }

  /**
   * Displays performance metrics
   *
   * @param violations - Array of violations analyzed
   * @param elapsedMs - Time taken for analysis in milliseconds
   */
  private displayMetrics(violations: ArchitecturalViolationModel[], elapsedMs: number): void {
    console.log('📊 Performance Metrics');
    console.log('─'.repeat(50));

    // Time formatting
    const timeStr = elapsedMs < 1000
      ? `${elapsedMs}ms`
      : `${(elapsedMs / 1000).toFixed(2)}s`;

    console.log(`⏱️  Analysis Time: ${timeStr}`);

    // Violation breakdown by type
    const ruleTypes = new Map<string, number>();
    violations.forEach(v => {
      const count = ruleTypes.get(v.ruleName) || 0;
      ruleTypes.set(v.ruleName, count + 1);
    });

    if (ruleTypes.size > 0) {
      console.log(`📋 Rules Triggered: ${ruleTypes.size}`);
      console.log(`🔍 Total Violations: ${violations.length}`);

      // Show top 3 most violated rules
      const sortedRules = Array.from(ruleTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (sortedRules.length > 0) {
        console.log(`📌 Most Common Issues:`);
        sortedRules.forEach(([ruleName, count]) => {
          console.log(`   • ${ruleName}: ${count} violation${count > 1 ? 's' : ''}`);
        });
      }
    }

    console.log('─'.repeat(50));
  }

  /**
   * Displays a single violation
   *
   * @param violation - The violation to display
   * @param index - The violation number
   */
  private displayViolation(violation: ArchitecturalViolationModel, index: number): void {
    console.log(`  ${index}. [${violation.ruleName}]`);
    console.log(`     File: ${violation.file}`);
    if (violation.fromRole && violation.toRole) {
      console.log(`     ${violation.fromRole} → ${violation.toRole}`);
    }
    if (violation.dependency) {
      console.log(`     Dependency: ${violation.dependency}`);
    }
    console.log(`     ${violation.message}`);
    console.log('');
  }

  /**
   * Displays an error message
   *
   * @param error - The error that occurred
   */
  private displayError(error: unknown): void {
    console.error('');
    console.error('❌ Error during analysis:');
    console.error('');

    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      if (error.stack && process.env.DEBUG) {
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error('  An unknown error occurred');
    }

    console.error('');
  }
}

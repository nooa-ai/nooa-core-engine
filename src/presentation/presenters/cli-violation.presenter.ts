/**
 * Presentation: CLI Violation Presenter
 *
 * Orchestrates CLI output formatting by delegating to specialized components.
 * Separates presentation concerns from controller orchestration.
 *
 * Design: Composition over inheritance - delegates to focused components
 * Each component handles one aspect of CLI output (SRP)
 *
 * ISP: Presenter only depends on what it needs:
 * - IDisplayConfigProvider (to check if debug mode is enabled)
 *   This is a presentation concern - display configuration
 */

import { ArchitecturalViolationModel } from '../../domain/models';
import { IDisplayConfigProvider } from '../protocols/display-config-provider';
import {
  UsageComponent,
  ViolationFormatterComponent,
  MetricsFormatterComponent,
  ErrorFormatterComponent,
  SummaryFormatterComponent,
} from '../components';

/**
 * Presenter for formatting CLI output of architectural violations
 *
 * Acts as facade/coordinator for presentation components
 */
export class CliViolationPresenter {
  private readonly usageComponent: UsageComponent;
  private readonly violationFormatter: ViolationFormatterComponent;
  private readonly metricsFormatter: MetricsFormatterComponent;
  private readonly errorFormatter: ErrorFormatterComponent;
  private readonly summaryFormatter: SummaryFormatterComponent;

  constructor(displayConfig: IDisplayConfigProvider) {
    this.usageComponent = new UsageComponent();
    this.violationFormatter = new ViolationFormatterComponent();
    this.metricsFormatter = new MetricsFormatterComponent();
    this.errorFormatter = new ErrorFormatterComponent(displayConfig);
    this.summaryFormatter = new SummaryFormatterComponent(this.violationFormatter);
  }

  /**
   * Displays usage information
   */
  displayUsage(): void {
    this.usageComponent.display();
  }

  /**
   * Displays analysis results
   *
   * @param violations - Array of architectural violations found
   * @param elapsedMs - Time taken for analysis in milliseconds
   */
  displayResults(violations: ArchitecturalViolationModel[], elapsedMs: number): void {
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

    this.summaryFormatter.display(violations);
    this.displayMetrics(violations, elapsedMs);
  }

  /**
   * Displays performance metrics
   *
   * @param violations - Array of violations analyzed
   * @param elapsedMs - Time taken for analysis in milliseconds
   */
  displayMetrics(violations: ArchitecturalViolationModel[], elapsedMs: number): void {
    this.metricsFormatter.display(violations, elapsedMs);
  }

  /**
   * Displays a single violation
   *
   * @param violation - The violation to display
   * @param index - The violation number
   */
  displayViolation(violation: ArchitecturalViolationModel, index: number): void {
    this.violationFormatter.display(violation, index);
  }

  /**
   * Displays an error message
   *
   * @param error - The error that occurred
   */
  displayError(error: unknown): void {
    this.errorFormatter.display(error);
  }
}

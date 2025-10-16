/**
 * Summary Formatter Component
 *
 * Groups violations by severity and displays summary statistics.
 */
import { ArchitecturalViolationModel } from '../../domain/models';
import { ViolationFormatterComponent } from './violation-formatter.component';

export class SummaryFormatterComponent {
  constructor(private readonly violationFormatter: ViolationFormatterComponent) {}

  display(violations: ArchitecturalViolationModel[]): void {
    // Group violations by severity
    const errors = violations.filter((v) => v.severity === 'error');
    const warnings = violations.filter((v) => v.severity === 'warning');
    const infos = violations.filter((v) => v.severity === 'info');

    // Display errors
    if (errors.length > 0) {
      console.log(`🔴 ERRORS (${errors.length}):`);
      errors.forEach((violation, index) => {
        this.violationFormatter.display(violation, index + 1);
      });
      console.log('');
    }

    // Display warnings
    if (warnings.length > 0) {
      console.log(`🟡 WARNINGS (${warnings.length}):`);
      warnings.forEach((violation, index) => {
        this.violationFormatter.display(violation, index + 1);
      });
      console.log('');
    }

    // Display infos
    if (infos.length > 0) {
      console.log(`🔵 INFO (${infos.length}):`);
      infos.forEach((violation, index) => {
        this.violationFormatter.display(violation, index + 1);
      });
      console.log('');
    }

    // Summary line
    console.log('='.repeat(50));
    console.log(`Summary: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info`);
    console.log('');
  }
}

/**
 * Violation Formatter Component
 *
 * Formats and displays a single architectural violation.
 */
import { ArchitecturalViolationModel } from '../../domain/models';

export class ViolationFormatterComponent {
  display(violation: ArchitecturalViolationModel, index: number): void {
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
}

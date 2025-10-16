/**
 * Usage Component
 *
 * Displays CLI usage instructions.
 */
export class UsageComponent {
  display(): void {
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
}

/**
 * Error Formatter Component
 *
 * Formats and displays error messages with optional stack traces.
 */
import { IDisplayConfigProvider } from '../protocols/display-config-provider';

export class ErrorFormatterComponent {
  constructor(private readonly displayConfig: IDisplayConfigProvider) {}

  display(error: unknown): void {
    console.error('');
    console.error('❌ Error during analysis:');
    console.error('');

    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      if (error.stack && this.displayConfig.isDebugMode()) {
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

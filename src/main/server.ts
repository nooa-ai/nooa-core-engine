/**
 * Application Entry Point
 *
 * This is the main entry point of the Nooa Core Engine application.
 * It composes all dependencies and starts the CLI controller.
 *
 * Following Clean Architecture principles:
 * - Lives in the Main layer (composition root)
 * - Knows about all layers
 * - Wires everything together
 * - Delegates execution to the Presentation layer
 */

import { CliController } from '../presentation/controllers';
import { makeAnalyzeCodebaseUseCase } from './factories';

/**
 * Bootstrap the application
 */
async function main() {
  // Create the use case using the factory
  const analyzeCodebaseUseCase = makeAnalyzeCodebaseUseCase();

  // Create the CLI controller with the use case
  const cliController = new CliController(analyzeCodebaseUseCase);

  // Handle the CLI command
  await cliController.handle(process);
}

// Execute the application
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

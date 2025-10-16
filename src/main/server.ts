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

import { makeCliController } from './factories/controllers/cli-controller.factory';

/**
 * Bootstrap the application
 */
async function main() {
  // Create the CLI controller with all dependencies using the factory
  const cliController = makeCliController();

  // Handle the CLI command
  await cliController.handle(process);
}

// Execute the application
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

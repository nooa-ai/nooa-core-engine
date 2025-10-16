/**
 * CLI Controller Factory
 *
 * Factory for creating the CLI controller with all its dependencies.
 * This is the composition root for the CLI presentation layer.
 */

import { CliController } from '../../../presentation/controllers';
import { CliArgsValidation } from '../../../validation/validators';
import { makeAnalyzeCodebaseUseCase } from '../analyze-codebase.factory';

/**
 * Creates a CLI controller instance with all dependencies injected
 *
 * @returns Fully configured CLI controller
 */
export function makeCliController(): CliController {
  // Create the validator
  const validator = new CliArgsValidation();

  // Create the use case
  const analyzeCodebaseUseCase = makeAnalyzeCodebaseUseCase();

  // Create and return the controller with all dependencies
  return new CliController(analyzeCodebaseUseCase, validator);
}

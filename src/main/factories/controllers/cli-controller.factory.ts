/**
 * CLI Controller Factory
 *
 * Factory for creating the CLI controller with all its dependencies.
 * This is the composition root for the CLI presentation layer.
 */

import { CliController } from '../../../presentation/controllers';
import { CliArgsValidation } from '../../../validation/validators';
import { NodeCliAdapter } from '../../../infra/adapters/node-cli.adapter';
import { CliViolationPresenter } from '../../../presentation/presenters/cli-violation.presenter';
import { makeAnalyzeCodebaseUseCase } from '../usecases/analyze-codebase.factory';

/**
 * Creates a CLI controller instance with all dependencies injected
 *
 * @returns Fully configured CLI controller
 */
export function makeCliController(): CliController {
  // Create infrastructure adapters
  const processAdapter = new NodeCliAdapter();
  const validator = new CliArgsValidation();
  const presenter = new CliViolationPresenter(processAdapter);

  // Create the use case
  const analyzeCodebaseUseCase = makeAnalyzeCodebaseUseCase();

  // Create and return the controller with all dependencies
  return new CliController(analyzeCodebaseUseCase, validator, processAdapter, presenter);
}

/**
 * CLI Controller Factory
 *
 * Factory for creating the CLI controller with all its dependencies.
 * This is the composition root for the CLI presentation layer.
 *
 * ISP: NodeCliAdapter implements all 3 interfaces, but each consumer
 * only receives what it needs through type declarations:
 * - Controller: IProcessArgsProvider + IProcessExitHandler (presentation concerns)
 * - Presenter: IDisplayConfigProvider (presentation concern - abstracted from env)
 */

import { CliController } from '../../../presentation/controllers';
import { CliArgsValidation } from '../../../validation/validators';
import { NodeCliAdapter } from '../../../infra/adapters/node-cli.adapter';
import { EnvDisplayConfigAdapter } from '../../../infra/adapters/env-display-config.adapter';
import { CliViolationPresenter } from '../../../presentation/presenters/cli-violation.presenter';
import { makeAnalyzeCodebaseUseCase } from '../usecases/analyze-codebase.factory';

/**
 * Creates a CLI controller instance with all dependencies injected
 *
 * @returns Fully configured CLI controller
 */
export function makeCliController(): CliController {
  // Create infrastructure adapter (implements all 3 process interfaces)
  const processAdapter = new NodeCliAdapter();

  // Create display config adapter (bridges env to display config)
  const displayConfig = new EnvDisplayConfigAdapter(processAdapter);

  // Create validator
  const validator = new CliArgsValidation();

  // Create presenter (receives only IDisplayConfigProvider)
  const presenter = new CliViolationPresenter(displayConfig);

  // Create the use case
  const analyzeCodebaseUseCase = makeAnalyzeCodebaseUseCase();

  // Create and return the controller with all dependencies
  // Controller receives: IProcessArgsProvider + IProcessExitHandler
  return new CliController(
    analyzeCodebaseUseCase,
    validator,
    processAdapter, // as IProcessArgsProvider
    processAdapter, // as IProcessExitHandler
    presenter
  );
}

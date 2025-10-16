/**
 * CLI Arguments Validator
 *
 * Validates CLI arguments according to the application requirements.
 * This validator ensures that the user provides valid input before
 * the controller forwards it to the use cases.
 */

import {
  IValidation,
  ValidationError,
  ValidationResult,
} from '../../presentation/protocols/validation';

/**
 * CLI arguments input structure
 */
export type CliArgsInput = {
  args: string[];
};

/**
 * Validates CLI arguments
 *
 * Ensures that:
 * - Arguments array is provided
 * - At least one argument is present (project path)
 * - Project path is not empty
 */
export class CliArgsValidation implements IValidation {
  check(input: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    // Type guard: ensure input is an object
    if (!input || typeof input !== 'object') {
      errors.push({
        field: 'input',
        message: 'Input must be an object',
      });
      return { success: false, errors };
    }

    // Type guard: ensure args field exists
    if (!('args' in input)) {
      errors.push({
        field: 'args',
        message: 'Arguments array is required',
      });
      return { success: false, errors };
    }

    const typedInput = input as CliArgsInput;

    // Validate args is an array
    if (!Array.isArray(typedInput.args)) {
      errors.push({
        field: 'args',
        message: 'Arguments must be an array',
      });
      return { success: false, errors };
    }

    // Validate at least one argument is provided
    if (typedInput.args.length === 0) {
      errors.push({
        field: 'args',
        message: 'At least one argument is required (project path)',
      });
    }

    // Validate first argument (project path) is not empty
    if (typedInput.args.length > 0) {
      const projectPath = typedInput.args[0];
      if (!projectPath || projectPath.trim() === '') {
        errors.push({
          field: 'projectPath',
          message: 'Project path cannot be empty',
        });
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }
}

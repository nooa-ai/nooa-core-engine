/**
 * Validation protocol
 *
 * Defines the contract for validators in the presentation layer.
 * Validators are responsible for validating user input before
 * it reaches the use cases.
 */

/**
 * Validation error details
 */
export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Validation result
 */
export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};

/**
 * Validation protocol interface
 */
export interface IValidation {
  /**
   * Validates input data
   *
   * @param input - The input data to validate
   * @returns Validation result with errors if any
   */
  validate(input: unknown): ValidationResult;
}

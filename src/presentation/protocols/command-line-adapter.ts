/**
 * Process Adapter Protocol
 *
 * Defines the contract for accessing process information in the presentation layer.
 * This abstraction allows controllers to access CLI arguments and exit codes
 * without directly depending on Node.js process object.
 */

/**
 * Process adapter interface
 */
export interface ICommandLineAdapter {
  /**
   * Gets command line arguments (excluding node and script paths)
   *
   * @returns Array of command line arguments
   */
  getArgs(): string[];

  /**
   * Gets an environment variable value
   *
   * @param key - Environment variable name
   * @returns Environment variable value or undefined
   */
  getEnv(key: string): string | undefined;

  /**
   * Exits the process with given code
   *
   * @param code - Exit code (0 for success, non-zero for error)
   */
  exit(code: number): void;
}

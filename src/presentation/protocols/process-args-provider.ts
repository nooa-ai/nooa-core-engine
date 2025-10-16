/**
 * Presentation Protocol: Process Arguments Provider
 *
 * Provides access to command-line arguments.
 * This is a presentation concern - CLI input.
 *
 * ISP: Single responsibility - only provides args
 */

export interface IProcessArgsProvider {
  /**
   * Gets command-line arguments (without node path and script path)
   */
  getArgs(): string[];
}

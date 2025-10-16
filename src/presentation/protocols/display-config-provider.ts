/**
 * Presentation Protocol: Display Configuration Provider
 *
 * Provides display-related configuration for presenters.
 * This abstracts away the source of configuration (could be env vars, config files, etc.)
 *
 * ISP: Single responsibility - only provides display configuration
 */

export interface IDisplayConfigProvider {
  /**
   * Checks if debug mode is enabled for verbose output
   * @returns true if debug mode is enabled
   */
  isDebugMode(): boolean;
}

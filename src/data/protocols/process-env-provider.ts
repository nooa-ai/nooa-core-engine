/**
 * Data Protocol: Process Environment Provider
 *
 * Provides access to environment variables (configuration).
 * This is a data concern - configuration/environment data.
 *
 * ISP: Single responsibility - only provides environment variables
 */

export interface IProcessEnvProvider {
  /**
   * Gets an environment variable value
   * @param key - Environment variable name
   * @returns Value if exists, undefined otherwise
   */
  getEnv(key: string): string | undefined;
}

/**
 * Infrastructure: Environment-based Display Configuration Adapter
 *
 * Implements IDisplayConfigProvider by reading from environment variables.
 * This adapter bridges the data layer (env) to presentation layer (display config).
 */

import { IDisplayConfigProvider } from '../../presentation/protocols/display-config-provider';
import { IProcessEnvProvider } from '../../data/protocols/process-env-provider';

/**
 * Adapter that provides display configuration from environment variables
 */
export class EnvDisplayConfigAdapter implements IDisplayConfigProvider {
  constructor(private readonly envProvider: IProcessEnvProvider) {}

  isDebugMode(): boolean {
    const debug = this.envProvider.getEnv('DEBUG');
    return Boolean(debug);
  }
}

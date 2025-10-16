/**
 * Node.js CLI Adapter
 *
 * Infrastructure adapter that wraps Node.js runtime environment.
 * Implements 3 segregated interfaces following ISP:
 * - IProcessArgsProvider (presentation concern)
 * - IProcessExitHandler (presentation concern)
 * - IProcessEnvProvider (data concern)
 *
 * Each interface has exactly 1 method = 1 responsibility.
 * This prevents architectural ambiguity and layer conflicts.
 */

import { IProcessArgsProvider } from '../../presentation/protocols/process-args-provider';
import { IProcessExitHandler } from '../../presentation/protocols/process-exit-handler';
import { IProcessEnvProvider } from '../../data/protocols/process-env-provider';

/**
 * Adapter for Node.js command-line environment
 *
 * Implements all 3 process-related interfaces.
 * Consumers inject only what they need (ISP).
 */
export class NodeCliAdapter
  implements
    IProcessArgsProvider,
    IProcessExitHandler,
    IProcessEnvProvider
{
  constructor(private readonly runtime: NodeJS.Process = global.process) {}

  getArgs(): string[] {
    // Skip first two arguments (node path and script path)
    return this.runtime.argv.slice(2);
  }

  exit(code: number): void {
    this.runtime.exit(code);
  }

  getEnv(key: string): string | undefined {
    return this.runtime.env[key];
  }
}

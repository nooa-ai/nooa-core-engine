/**
 * Node.js CLI Adapter
 *
 * Infrastructure adapter that wraps Node.js runtime environment.
 * Provides a clean interface for CLI operations following
 * the Dependency Inversion Principle.
 */

import { ICommandLineAdapter } from '../../presentation/protocols/command-line-adapter';

/**
 * Adapter for Node.js command-line environment
 *
 * Wraps the Node.js global runtime and provides a clean interface
 * following the Dependency Inversion Principle.
 */
export class NodeCliAdapter implements ICommandLineAdapter {
  constructor(private readonly runtime: NodeJS.Process = global.process) {}

  getArgs(): string[] {
    // Skip first two arguments (node path and script path)
    return this.runtime.argv.slice(2);
  }

  getEnv(key: string): string | undefined {
    return this.runtime.env[key];
  }

  exit(code: number): void {
    this.runtime.exit(code);
  }
}

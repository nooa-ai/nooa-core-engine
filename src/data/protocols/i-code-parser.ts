/**
 * Protocol: Code Parser
 *
 * This interface defines the contract for parsing source code files.
 * It abstracts away the details of HOW code is parsed (ts-morph, babel, etc.)
 * and focuses on WHAT we need: code symbols with their dependencies.
 *
 * This is a protocol in the Data layer, which means:
 * - It can depend on Domain models
 * - It will be implemented by the Infrastructure layer
 * - It enables Dependency Inversion Principle
 */

import { CodeSymbolModel } from '../../domain/models';

/**
 * Interface for parsing source code and extracting symbols
 */
export interface ICodeParser {
  /**
   * Parses a project and extracts all code symbols with their dependencies
   *
   * @param projectPath - Root path of the project to parse
   * @returns Promise resolving to an array of code symbols
   */
  parse(projectPath: string): Promise<CodeSymbolModel[]>;
}

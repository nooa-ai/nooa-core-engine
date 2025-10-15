/**
 * Protocol: Grammar Repository
 *
 * This interface defines the contract for loading architectural grammar configurations.
 * It abstracts away the details of HOW the grammar is stored (YAML, JSON, database, etc.)
 * and focuses on WHAT we need: the complete grammar model.
 *
 * This is a protocol in the Data layer, which means:
 * - It can depend on Domain models
 * - It will be implemented by the Infrastructure layer
 * - It enables Dependency Inversion Principle
 */

import { GrammarModel } from '../../domain/models';

/**
 * Interface for loading architectural grammar configurations
 */
export interface IGrammarRepository {
  /**
   * Loads the grammar configuration for a project
   *
   * @param projectPath - Root path of the project containing the grammar file
   * @returns Promise resolving to the complete grammar model
   * @throws Error if grammar file is not found or invalid
   */
  load(projectPath: string): Promise<GrammarModel>;
}

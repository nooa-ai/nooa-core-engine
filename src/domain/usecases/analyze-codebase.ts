/**
 * Use Case Interface: Analyze Codebase
 *
 * This is the main domain contract for the architectural analysis feature.
 * It defines the business capability of analyzing a codebase against architectural rules.
 *
 * Following Clean Architecture principles, this interface:
 * - Lives in the Domain layer (innermost circle)
 * - Has NO dependencies on outer layers
 * - Defines the contract that will be implemented by the Data layer
 */

import { ArchitecturalViolationModel } from '../models';

/**
 * Interface for the Analyze Codebase use case
 */
export interface IAnalyzeCodebase {
  /**
   * Analyzes a codebase for architectural violations
   *
   * @param params - Analysis parameters including project path
   * @returns Promise resolving to an array of violations found
   */
  analyze(params: IAnalyzeCodebase.Params): Promise<IAnalyzeCodebase.Result>;
}

/**
 * Namespace for type definitions related to IAnalyzeCodebase
 * This pattern keeps related types together while avoiding export pollution
 */
export namespace IAnalyzeCodebase {
  /**
   * Input parameters for the analyze operation
   */
  export type Params = {
    /** Absolute or relative path to the project root directory */
    projectPath: string;
  };

  /**
   * Result of the analyze operation
   * An array of violations found, empty array if no violations
   */
  export type Result = ArchitecturalViolationModel[];
}

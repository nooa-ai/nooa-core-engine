/**
 * Factory: Analyze Codebase Use Case
 *
 * This factory is responsible for composing all the dependencies needed
 * for the Analyze Codebase use case and wiring them together.
 *
 * This is the Dependency Injection composition root.
 * Following Clean Architecture principles:
 * - Lives in the Main layer (outermost layer)
 * - Knows about all layers and can import from them
 * - Creates concrete instances and injects them
 * - Returns an interface (from Domain), hiding implementation details
 */

import { IAnalyzeCodebase } from '../../../domain/usecases';
import { AnalyzeCodebaseUseCase } from '../../../data/usecases';
import { TSMorphParserAdapter } from '../../../infra/parsers';
import { YamlGrammarRepository } from '../../../infra/repositories';

/**
 * Factory function that creates and configures the Analyze Codebase use case
 *
 * This function:
 * 1. Instantiates all infrastructure adapters (parser, repository)
 * 2. Injects them into the use case implementation
 * 3. Returns the use case as an interface (abstraction)
 *
 * @returns Fully configured IAnalyzeCodebase instance
 */
export const makeAnalyzeCodebaseUseCase = (): IAnalyzeCodebase => {
  // Create infrastructure adapters
  const codeParser = new TSMorphParserAdapter();
  const grammarRepository = new YamlGrammarRepository();

  // Create use case with dependency injection
  const analyzeCodebaseUseCase = new AnalyzeCodebaseUseCase(
    codeParser,
    grammarRepository
  );

  // Return as interface (dependency inversion)
  return analyzeCodebaseUseCase;
};

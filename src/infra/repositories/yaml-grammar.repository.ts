/**
 * Infrastructure Repository: YAML Grammar Repository
 *
 * This repository implements the IGrammarRepository protocol using YAML files.
 * It's responsible for the technical details of reading and parsing grammar files.
 *
 * Following Clean Architecture principles:
 * - Implements a protocol from the Data layer
 * - Contains infrastructure-specific code (file system, YAML parsing)
 * - Can be replaced with another storage mechanism (JSON, database, etc.)
 */

import { IGrammarRepository } from '../../data/protocols';
import { GrammarModel } from '../../domain/models';
import {
  YamlParserHelper,
  GrammarValidatorHelper,
  GrammarTransformerHelper,
} from './helpers';

/**
 * YAML-based grammar repository implementation
 */
export class YamlGrammarRepository implements IGrammarRepository {
  private yamlParser: YamlParserHelper;
  private validator: GrammarValidatorHelper;
  private transformer: GrammarTransformerHelper;

  constructor() {
    this.yamlParser = new YamlParserHelper();
    this.validator = new GrammarValidatorHelper();
    this.transformer = new GrammarTransformerHelper();
  }

  /**
   * Loads the grammar configuration from a YAML file
   *
   * Looks for files named 'nooa.grammar.yaml' or 'nooa.grammar.yml'
   *
   * @param projectPath - Root path of the project
   * @returns Promise resolving to the grammar model
   * @throws Error if grammar file is not found or invalid
   */
  async load(projectPath: string): Promise<GrammarModel> {
    // Parse YAML file
    const parsedContent = await this.yamlParser.parseGrammarFile(projectPath);

    // Validate and transform to GrammarModel
    const grammar = this.validateAndTransform(parsedContent, projectPath);

    return grammar;
  }

  /**
   * Validates the parsed YAML content and transforms it into a GrammarModel
   *
   * @param content - Parsed YAML content
   * @param projectPath - Path to the project (for error messages)
   * @returns Validated and transformed GrammarModel
   * @throws Error if the content is invalid
   */
  private validateAndTransform(content: any, projectPath: string): GrammarModel {
    // Construct file path for error messages
    const filePath = `${projectPath}/nooa.grammar.yaml`;

    // Validate
    this.validator.validate(content, filePath);

    // Transform
    return this.transformer.transform(content);
  }
}

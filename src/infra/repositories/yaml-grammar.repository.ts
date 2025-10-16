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

import { IGrammarRepository, IFileSystem } from '../../data/protocols';
import { GrammarModel } from '../../domain/models';
import {
  YamlParserHelper,
  GrammarTransformerHelper,
} from './helpers';
import { SchemaValidator } from '../validators/schema.validator';
import { SemanticGrammarValidator } from '../validators/semantic-grammar.validator';
import { NodeFileSystemAdapter } from '../adapters/node-file-system.adapter';
import * as path from 'path';

/**
 * YAML-based grammar repository implementation
 */
export class YamlGrammarRepository implements IGrammarRepository {
  private yamlParser: YamlParserHelper;
  private schemaValidator: SchemaValidator;
  private semanticValidator: SemanticGrammarValidator;
  private transformer: GrammarTransformerHelper;

  constructor(private readonly fileSystem: IFileSystem = new NodeFileSystemAdapter()) {
    // YamlParserHelper needs both IFileReader and IFileExistenceChecker (ISP)
    // Same fileSystem instance provides both interfaces
    this.yamlParser = new YamlParserHelper(this.fileSystem, this.fileSystem);
    this.schemaValidator = new SchemaValidator(this.fileSystem);
    this.semanticValidator = new SemanticGrammarValidator();
    this.transformer = new GrammarTransformerHelper();

    // Load JSON schema (from project root)
    const schemaPath = path.join(process.cwd(), 'nooa.schema.json');
    try {
      this.schemaValidator.loadSchema(schemaPath);
    } catch (error) {
      // Schema validation is optional - if schema not found, skip it
      // This maintains backward compatibility
      console.warn(`Schema file not found at ${schemaPath}. Skipping schema validation.`);
    }
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
    // Parse YAML file (synchronous via injected fileSystem adapter)
    const parsedContent = this.yamlParser.parseGrammarFile(projectPath);

    // Validate and transform to GrammarModel
    const grammar = this.validateAndTransform(parsedContent, projectPath);

    return grammar;
  }

  /**
   * Validates the parsed YAML content and transforms it into a GrammarModel
   *
   * Two-layer validation:
   * 1. Schema validation (structural - via JSON schema)
   *    - Types, required fields, enums, ranges
   * 2. Semantic validation (business rules)
   *    - Regex validity, role references, rule name uniqueness
   *
   * @param content - Parsed YAML content
   * @param projectPath - Path to the project (for error messages)
   * @returns Validated and transformed GrammarModel
   * @throws Error if the content is invalid
   */
  private validateAndTransform(content: any, projectPath: string): GrammarModel {
    // Construct file path for error messages
    const filePath = `${projectPath}/nooa.grammar.yaml`;

    // Layer 1: Schema validation (if schema loaded)
    try {
      const schemaResult = this.schemaValidator.validate(content);
      if (!schemaResult.valid) {
        const errorMessage = schemaResult.errors.join('\n  - ');
        throw new Error(`Grammar file failed schema validation:\n  - ${errorMessage}`);
      }
    } catch (error) {
      // If schema validator not initialized (no schema file), skip this step
      if (error instanceof Error && !error.message.includes('Schema not loaded')) {
        throw error;
      }
    }

    // Layer 2: Semantic validation (regex, role references, uniqueness)
    this.semanticValidator.validate(content, filePath);

    // Transform
    return this.transformer.transform(content);
  }
}

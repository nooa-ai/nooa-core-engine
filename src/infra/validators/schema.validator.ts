/**
 * Schema Validator
 *
 * Validates grammar YAML against JSON Schema.
 * Enables BigO(1) iteration - add new rule types by only editing schema.json,
 * no TypeScript code changes needed.
 *
 * This is the key to making grammar truly data-driven:
 * - Grammar structure defined in nooa.schema.json
 * - Rule types defined as data in schema
 * - Validator checks grammar conforms to schema
 * - AI can iterate on schema.json + nooa.grammar.yaml only
 *
 * Clean Architecture:
 * - Depends on IFileSystem abstraction (not concrete fs module)
 * - Injected via constructor for testability
 * - No direct infrastructure dependencies
 */
import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import * as path from 'path';
import { IFileSystem } from '../../data/protocols/i-file-system';

export class SchemaValidator {
  private ajv: Ajv;
  private validator: ValidateFunction | null = null;

  constructor(private readonly fileSystem: IFileSystem) {
    // Initialize AJV with strict mode for better validation
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: true,
    });

    // Add format validators (email, uri, regex, etc.)
    addFormats(this.ajv);
  }

  /**
   * Load and compile JSON schema from file
   */
  loadSchema(schemaPath: string): void {
    try {
      const schemaContent = this.fileSystem.readFileSync(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);

      // Compile schema for validation
      this.validator = this.ajv.compile(schema);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load schema from ${schemaPath}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate grammar object against loaded schema
   *
   * @param grammar - Parsed grammar object from YAML
   * @returns Validation result with errors if invalid
   */
  validate(grammar: any): { valid: boolean; errors: string[] } {
    if (!this.validator) {
      throw new Error('Schema not loaded. Call loadSchema() first.');
    }

    const valid = this.validator(grammar);

    if (valid) {
      return { valid: true, errors: [] };
    }

    // Format validation errors into human-readable messages
    const errors = this.formatErrors(this.validator.errors || []);
    return { valid: false, errors };
  }

  /**
   * Format AJV errors into human-readable messages
   */
  private formatErrors(ajvErrors: ErrorObject[]): string[] {
    return ajvErrors.map(error => {
      const path = error.instancePath || 'root';
      const message = error.message || 'validation failed';

      // Include additional context for certain error types
      if (error.keyword === 'enum') {
        const allowedValues = error.params.allowedValues || [];
        return `${path}: ${message}. Allowed values: ${allowedValues.join(', ')}`;
      }

      if (error.keyword === 'additionalProperties') {
        const additionalProp = error.params.additionalProperty;
        return `${path}: has unexpected property '${additionalProp}'`;
      }

      if (error.keyword === 'required') {
        const missingProp = error.params.missingProperty;
        return `${path}: missing required property '${missingProp}'`;
      }

      if (error.keyword === 'type') {
        const expectedType = error.params.type;
        return `${path}: ${message} (expected ${expectedType})`;
      }

      return `${path}: ${message}`;
    });
  }

  /**
   * Static helper: Load schema and validate grammar in one call
   *
   * Note: This static method creates its own dependencies (not ideal for testing).
   * Prefer injecting SchemaValidator via constructor for better testability.
   */
  static validateGrammarFile(
    grammarPath: string,
    schemaPath?: string,
    fileSystem?: IFileSystem
  ): { valid: boolean; errors: string[] } {
    // Import dependencies only when needed
    const yaml = require('yaml');

    // Use provided fileSystem or create default (for backward compatibility)
    const fs = fileSystem || (() => {
      const { NodeFileSystemAdapter } = require('../adapters/node-file-system.adapter');
      return new NodeFileSystemAdapter();
    })();

    // Default schema path: nooa.schema.json in project root
    const defaultSchemaPath = path.join(process.cwd(), 'nooa.schema.json');
    const finalSchemaPath = schemaPath || defaultSchemaPath;

    const validator = new SchemaValidator(fs);
    validator.loadSchema(finalSchemaPath);

    // Load grammar YAML (assuming it's already parsed)
    const grammarContent = fs.readFileSync(grammarPath, 'utf-8');
    const grammar = yaml.parse(grammarContent);

    return validator.validate(grammar);
  }
}

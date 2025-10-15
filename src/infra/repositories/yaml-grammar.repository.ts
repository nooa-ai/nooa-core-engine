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

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { IGrammarRepository } from '../../data/protocols';
import { GrammarModel } from '../../domain/models';

/**
 * YAML-based grammar repository implementation
 */
export class YamlGrammarRepository implements IGrammarRepository {
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
    // Try to find the grammar file (try both .yaml and .yml extensions)
    const possibleFilenames = ['nooa.grammar.yaml', 'nooa.grammar.yml'];
    let grammarFilePath: string | null = null;

    for (const filename of possibleFilenames) {
      const testPath = path.join(projectPath, filename);
      try {
        await fs.access(testPath);
        grammarFilePath = testPath;
        break;
      } catch {
        // File doesn't exist, try next
        continue;
      }
    }

    if (!grammarFilePath) {
      throw new Error(
        `Grammar file not found. Expected 'nooa.grammar.yaml' or 'nooa.grammar.yml' in ${projectPath}`
      );
    }

    // Read the file
    const fileContent = await fs.readFile(grammarFilePath, 'utf-8');

    // Parse YAML
    let parsedContent: any;
    try {
      parsedContent = yaml.parse(fileContent);
    } catch (error) {
      throw new Error(
        `Failed to parse grammar file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Validate and transform to GrammarModel
    const grammar = this.validateAndTransform(parsedContent, grammarFilePath);

    return grammar;
  }

  /**
   * Validates the parsed YAML content and transforms it into a GrammarModel
   *
   * @param content - Parsed YAML content
   * @param filePath - Path to the grammar file (for error messages)
   * @returns Validated and transformed GrammarModel
   * @throws Error if the content is invalid
   */
  private validateAndTransform(content: any, filePath: string): GrammarModel {
    // Validate required fields
    if (!content.version) {
      throw new Error(`Missing required field 'version' in ${filePath}`);
    }

    if (!content.language) {
      throw new Error(`Missing required field 'language' in ${filePath}`);
    }

    if (!Array.isArray(content.roles)) {
      throw new Error(`Missing or invalid 'roles' array in ${filePath}`);
    }

    if (!Array.isArray(content.rules)) {
      throw new Error(`Missing or invalid 'rules' array in ${filePath}`);
    }

    // Validate roles
    for (const role of content.roles) {
      if (!role.name || typeof role.name !== 'string') {
        throw new Error(`Invalid role: missing or invalid 'name' in ${filePath}`);
      }
      if (!role.path || typeof role.path !== 'string') {
        throw new Error(`Invalid role '${role.name}': missing or invalid 'path' in ${filePath}`);
      }
    }

    // Validate rules
    for (const rule of content.rules) {
      if (!rule.name || typeof rule.name !== 'string') {
        throw new Error(`Invalid rule: missing or invalid 'name' in ${filePath}`);
      }
      if (!rule.severity || !['error', 'warning', 'info'].includes(rule.severity)) {
        throw new Error(
          `Invalid rule '${rule.name}': severity must be 'error', 'warning', or 'info' in ${filePath}`
        );
      }
      if (!rule.rule || typeof rule.rule !== 'string') {
        throw new Error(`Invalid rule '${rule.name}': missing 'rule' type in ${filePath}`);
      }

      // Validate based on rule type
      if (rule.rule === 'naming_pattern') {
        // Naming pattern rule validation
        if (!rule.for || !rule.for.role) {
          throw new Error(`Invalid rule '${rule.name}': naming_pattern rules must have 'for.role' in ${filePath}`);
        }
        if (!rule.pattern || typeof rule.pattern !== 'string') {
          throw new Error(`Invalid rule '${rule.name}': naming_pattern rules must have a 'pattern' string in ${filePath}`);
        }
        // Validate that the pattern is a valid regex
        try {
          new RegExp(rule.pattern);
        } catch (error) {
          throw new Error(`Invalid rule '${rule.name}': pattern is not a valid regular expression in ${filePath}`);
        }
      } else if (rule.rule === 'find_synonyms') {
        // Synonym detection rule validation
        if (!rule.for || !rule.for.role) {
          throw new Error(`Invalid rule '${rule.name}': find_synonyms rules must have 'for.role' in ${filePath}`);
        }
        if (!rule.options || typeof rule.options !== 'object') {
          throw new Error(`Invalid rule '${rule.name}': find_synonyms rules must have an 'options' object in ${filePath}`);
        }
        if (typeof rule.options.similarity_threshold !== 'number') {
          throw new Error(`Invalid rule '${rule.name}': find_synonyms rules must have 'options.similarity_threshold' as a number in ${filePath}`);
        }
        if (rule.options.similarity_threshold < 0 || rule.options.similarity_threshold > 1) {
          throw new Error(`Invalid rule '${rule.name}': similarity_threshold must be between 0 and 1 in ${filePath}`);
        }
        if (rule.options.thesaurus && !Array.isArray(rule.options.thesaurus)) {
          throw new Error(`Invalid rule '${rule.name}': options.thesaurus must be an array in ${filePath}`);
        }
      } else if (rule.rule === 'detect_unreferenced') {
        // Unreferenced code detection rule validation
        if (!rule.for || !rule.for.role) {
          throw new Error(`Invalid rule '${rule.name}': detect_unreferenced rules must have 'for.role' in ${filePath}`);
        }
        if (rule.options && typeof rule.options !== 'object') {
          throw new Error(`Invalid rule '${rule.name}': detect_unreferenced rules 'options' must be an object in ${filePath}`);
        }
        if (rule.options?.ignore_patterns && !Array.isArray(rule.options.ignore_patterns)) {
          throw new Error(`Invalid rule '${rule.name}': options.ignore_patterns must be an array in ${filePath}`);
        }
      } else if (['allowed', 'forbidden', 'required'].includes(rule.rule)) {
        // Dependency rule validation
        if (!rule.from || !rule.from.role) {
          throw new Error(`Invalid rule '${rule.name}': dependency rules must have 'from.role' in ${filePath}`);
        }
        if (!rule.to || (!rule.to.role && !rule.to.circular)) {
          throw new Error(`Invalid rule '${rule.name}': dependency rules must have 'to.role' or 'to.circular' in ${filePath}`);
        }
        if (rule.to.role && rule.to.circular) {
          throw new Error(`Invalid rule '${rule.name}': 'to' cannot have both 'role' and 'circular' in ${filePath}`);
        }
      } else {
        throw new Error(
          `Invalid rule '${rule.name}': rule type must be 'allowed', 'forbidden', 'required', 'naming_pattern', 'find_synonyms', or 'detect_unreferenced' in ${filePath}`
        );
      }
    }

    // Transform to GrammarModel (already validated, so we can safely cast)
    const grammar: GrammarModel = {
      version: content.version,
      language: content.language,
      roles: content.roles.map((role: any) => ({
        name: role.name,
        path: role.path,
        description: role.description,
      })),
      rules: content.rules.map((rule: any) => {
        // Base properties
        const baseRule = {
          name: rule.name,
          severity: rule.severity,
          comment: rule.comment,
        };

        // Create different rule types based on rule.rule
        if (rule.rule === 'naming_pattern') {
          return {
            ...baseRule,
            for: {
              role: rule.for.role,
            },
            pattern: rule.pattern,
            rule: 'naming_pattern' as const,
          };
        } else if (rule.rule === 'find_synonyms') {
          return {
            ...baseRule,
            for: {
              role: rule.for.role,
            },
            options: {
              similarity_threshold: rule.options.similarity_threshold,
              thesaurus: rule.options.thesaurus,
            },
            rule: 'find_synonyms' as const,
          };
        } else if (rule.rule === 'detect_unreferenced') {
          return {
            ...baseRule,
            for: {
              role: rule.for.role,
            },
            options: rule.options
              ? {
                  ignore_patterns: rule.options.ignore_patterns,
                }
              : undefined,
            rule: 'detect_unreferenced' as const,
          };
        } else {
          // Dependency rule
          return {
            ...baseRule,
            from: {
              role: rule.from.role,
            },
            to: rule.to.circular
              ? { circular: true as const }
              : { role: rule.to.role },
            rule: rule.rule,
          };
        }
      }),
    };

    return grammar;
  }
}

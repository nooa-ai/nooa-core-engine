/**
 * YAML Parser Helper
 *
 * Handles file system operations and YAML parsing for grammar files.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

export class YamlParserHelper {
  private readonly possibleFilenames = ['nooa.grammar.yaml', 'nooa.grammar.yml'];

  /**
   * Finds and reads the grammar file from the project path
   *
   * @param projectPath - Root path of the project
   * @returns Promise resolving to parsed YAML content
   * @throws Error if grammar file is not found or cannot be parsed
   */
  async parseGrammarFile(projectPath: string): Promise<any> {
    const grammarFilePath = await this.findGrammarFile(projectPath);
    const fileContent = await fs.readFile(grammarFilePath, 'utf-8');
    return this.parseYaml(fileContent);
  }

  /**
   * Finds the grammar file in the project path
   *
   * @param projectPath - Root path of the project
   * @returns Promise resolving to the grammar file path
   * @throws Error if grammar file is not found
   */
  private async findGrammarFile(projectPath: string): Promise<string> {
    for (const filename of this.possibleFilenames) {
      const testPath = path.join(projectPath, filename);
      try {
        await fs.access(testPath);
        return testPath;
      } catch {
        // File doesn't exist, try next
        continue;
      }
    }

    throw new Error(
      `Grammar file not found. Expected 'nooa.grammar.yaml' or 'nooa.grammar.yml' in ${projectPath}`
    );
  }

  /**
   * Parses YAML content
   *
   * @param content - YAML content as string
   * @returns Parsed YAML content
   * @throws Error if YAML parsing fails
   */
  private parseYaml(content: string): any {
    try {
      return yaml.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to parse grammar file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

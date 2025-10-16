/**
 * YAML Parser Helper
 *
 * Handles file system operations and YAML parsing for grammar files.
 * Uses IFileReader and IFileExistenceChecker abstractions for DIP and ISP compliance.
 */

import * as path from 'path';
import * as yaml from 'yaml';
import { IFileReader, IFileExistenceChecker } from '../../../data/protocols';

export class YamlParserHelper {
  private readonly possibleFilenames = ['nooa.grammar.yaml', 'nooa.grammar.yml'];

  constructor(
    private readonly fileReader: IFileReader,
    private readonly fileExistenceChecker: IFileExistenceChecker
  ) {}

  /**
   * Finds and reads the grammar file from the project path
   *
   * @param projectPath - Root path of the project
   * @returns Parsed YAML content
   * @throws Error if grammar file is not found or cannot be parsed
   */
  parseGrammarFile(projectPath: string): any {
    const grammarFilePath = this.findGrammarFile(projectPath);
    const fileContent = this.fileReader.readFileSync(grammarFilePath, 'utf-8');
    return this.parseYaml(fileContent);
  }

  /**
   * Finds the grammar file in the project path
   *
   * @param projectPath - Root path of the project
   * @returns The grammar file path
   * @throws Error if grammar file is not found
   */
  private findGrammarFile(projectPath: string): string {
    for (const filename of this.possibleFilenames) {
      const testPath = path.join(projectPath, filename);
      if (this.fileExistenceChecker.existsSync(testPath)) {
        return testPath;
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

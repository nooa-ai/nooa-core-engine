import { ICodeParser } from '../../../src/data/protocols/i-code-parser';
import { CodeSymbolModel } from '../../../src/domain/models';

export class CodeParserSpy implements ICodeParser {
  projectPath?: string;
  result: CodeSymbolModel[] = [];

  async parse(projectPath: string): Promise<CodeSymbolModel[]> {
    this.projectPath = projectPath;
    return this.result;
  }
}

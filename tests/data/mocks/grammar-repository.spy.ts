import { IGrammarRepository } from '../../../src/data/protocols/i-grammar-repository';
import { GrammarModel } from '../../../src/domain/models';

export class GrammarRepositorySpy implements IGrammarRepository {
  projectPath?: string;
  result: GrammarModel;

  constructor(defaultResult: GrammarModel) {
    this.result = defaultResult;
  }

  async load(projectPath: string): Promise<GrammarModel> {
    this.projectPath = projectPath;
    return this.result;
  }
}

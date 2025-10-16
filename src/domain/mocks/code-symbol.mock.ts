import { CodeSymbolModel } from '../models/code-symbol.model';

const baseCodeSymbol: CodeSymbolModel = {
  path: 'src/sample/service.ts',
  name: 'SampleService',
  role: 'SERVICE',
  dependencies: ['src/sample/repository.ts'],
  symbolType: 'class',
};

export const makeCodeSymbolMock = (
  overrides: Partial<CodeSymbolModel> = {},
): CodeSymbolModel => ({
  ...baseCodeSymbol,
  ...overrides,
  dependencies: overrides.dependencies ?? [...baseCodeSymbol.dependencies],
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeAnalyzeCodebaseUseCase } from '../../../src/main/factories/usecases/analyze-codebase.factory';
import { AnalyzeCodebaseUseCase } from '../../../src/data/usecases/analyze-codebase.usecase';
import { TSMorphParserAdapter } from '../../../src/infra/parsers/ts-morph-parser.adapter';
import { YamlGrammarRepository } from '../../../src/infra/repositories/yaml-grammar.repository';
import { NodeFileSystemAdapter } from '../../../src/infra/adapters/node-file-system.adapter';

vi.mock('../../../src/data/usecases/analyze-codebase.usecase');
vi.mock('../../../src/infra/parsers/ts-morph-parser.adapter');
vi.mock('../../../src/infra/repositories/yaml-grammar.repository');
vi.mock('../../../src/infra/adapters/node-file-system.adapter');

describe('makeAnalyzeCodebaseUseCase Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should create and return a configured AnalyzeCodebaseUseCase instance', () => {
    const mockAnalyzeMethod = vi.fn();
    vi.mocked(AnalyzeCodebaseUseCase).mockImplementation(() => ({
      analyze: mockAnalyzeMethod
    }) as any);

    const result = makeAnalyzeCodebaseUseCase();

    // Check that all dependencies were instantiated
    expect(TSMorphParserAdapter).toHaveBeenCalled();
    expect(YamlGrammarRepository).toHaveBeenCalled();
    expect(NodeFileSystemAdapter).toHaveBeenCalled();

    // Check that the use case was created with the dependencies
    expect(AnalyzeCodebaseUseCase).toHaveBeenCalledWith(
      expect.any(Object), // TSMorphParserAdapter instance
      expect.any(Object), // YamlGrammarRepository instance
      expect.any(Object), // NodeFileSystemAdapter (IFileReader)
      expect.any(Object)  // NodeFileSystemAdapter (IFileExistenceChecker)
    );

    // Check that the result has the analyze method
    expect(result).toHaveProperty('analyze');
    expect(result.analyze).toBe(mockAnalyzeMethod);
  });

  it('should wire dependencies correctly', () => {
    const mockParser = { parse: vi.fn() };
    const mockRepository = { load: vi.fn() };
    const mockFileSystem = { readFileSync: vi.fn(), existsSync: vi.fn() };
    const mockUseCase = { analyze: vi.fn() };

    vi.mocked(TSMorphParserAdapter).mockImplementation(() => mockParser as any);
    vi.mocked(YamlGrammarRepository).mockImplementation(() => mockRepository as any);
    vi.mocked(NodeFileSystemAdapter).mockImplementation(() => mockFileSystem as any);
    vi.mocked(AnalyzeCodebaseUseCase).mockImplementation(() => mockUseCase as any);

    const result = makeAnalyzeCodebaseUseCase();

    // Verify the use case was created with the correct instances
    const [parserArg, repositoryArg, fileReaderArg, fileExistenceCheckerArg] = vi.mocked(AnalyzeCodebaseUseCase).mock.calls[0];
    expect(parserArg).toEqual(mockParser);
    expect(repositoryArg).toEqual(mockRepository);
    expect(fileReaderArg).toEqual(mockFileSystem);
    expect(fileExistenceCheckerArg).toEqual(mockFileSystem);

    // Verify the returned interface
    expect(result).toEqual(mockUseCase);
  });

  it('should return an object conforming to IAnalyzeCodebase interface', () => {
    const mockUseCase = {
      analyze: vi.fn().mockResolvedValue([])
    };

    vi.mocked(AnalyzeCodebaseUseCase).mockImplementation(() => mockUseCase as any);

    const result = makeAnalyzeCodebaseUseCase();

    expect(typeof result.analyze).toBe('function');
  });

  it('should create new instances each time the factory is called', () => {
    vi.mocked(AnalyzeCodebaseUseCase).mockImplementation(() => ({
      analyze: vi.fn()
    }) as any);

    const instance1 = makeAnalyzeCodebaseUseCase();
    const instance2 = makeAnalyzeCodebaseUseCase();

    // Should create new instances each time
    expect(TSMorphParserAdapter).toHaveBeenCalledTimes(2);
    expect(YamlGrammarRepository).toHaveBeenCalledTimes(2);
    expect(NodeFileSystemAdapter).toHaveBeenCalledTimes(2);
    expect(AnalyzeCodebaseUseCase).toHaveBeenCalledTimes(2);

    // Instances should be different
    expect(instance1).not.toBe(instance2);
  });
});
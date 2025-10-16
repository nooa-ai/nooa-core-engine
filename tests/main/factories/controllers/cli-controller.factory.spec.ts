import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeCliController } from '../../../../src/main/factories/controllers/cli-controller.factory';
import { CliController } from '../../../../src/presentation/controllers';
import { CliArgsValidation } from '../../../../src/validation/validators';
import { NodeCliAdapter } from '../../../../src/infra/adapters/node-cli.adapter';
import { EnvDisplayConfigAdapter } from '../../../../src/infra/adapters/env-display-config.adapter';
import { CliViolationPresenter } from '../../../../src/presentation/presenters/cli-violation.presenter';
import { makeAnalyzeCodebaseUseCase } from '../../../../src/main/factories/usecases/analyze-codebase.factory';

vi.mock('../../../../src/presentation/controllers');
vi.mock('../../../../src/validation/validators');
vi.mock('../../../../src/infra/adapters/node-cli.adapter');
vi.mock('../../../../src/infra/adapters/env-display-config.adapter');
vi.mock('../../../../src/presentation/presenters/cli-violation.presenter');
vi.mock('../../../../src/main/factories/usecases/analyze-codebase.factory');

describe('makeCliController Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create and return a configured CliController instance', () => {
    const mockHandleMethod = vi.fn();
    const mockUseCase = { analyze: vi.fn() };

    vi.mocked(makeAnalyzeCodebaseUseCase).mockReturnValue(mockUseCase as any);
    vi.mocked(CliController).mockImplementation(() => ({
      handle: mockHandleMethod
    }) as any);

    const result = makeCliController();

    // Check that all dependencies were instantiated
    expect(NodeCliAdapter).toHaveBeenCalled();
    expect(EnvDisplayConfigAdapter).toHaveBeenCalled();
    expect(CliArgsValidation).toHaveBeenCalled();
    expect(CliViolationPresenter).toHaveBeenCalled();
    expect(makeAnalyzeCodebaseUseCase).toHaveBeenCalled();

    // Check that the controller was created with the dependencies
    expect(CliController).toHaveBeenCalledWith(
      expect.any(Object), // analyzeCodebaseUseCase
      expect.any(Object), // validator
      expect.any(Object), // processAdapter (argsProvider)
      expect.any(Object), // processAdapter (exitHandler)
      expect.any(Object)  // presenter
    );

    // Check that the result has the handle method
    expect(result).toHaveProperty('handle');
    expect(result.handle).toBe(mockHandleMethod);
  });

  it('should wire dependencies correctly', () => {
    const mockProcessAdapter = { getArgs: vi.fn(), exit: vi.fn(), getEnv: vi.fn() };
    const mockDisplayConfig = { shouldUseColors: vi.fn(), shouldShowMetrics: vi.fn() };
    const mockValidator = { check: vi.fn() };
    const mockPresenter = { displayResults: vi.fn(), displayError: vi.fn(), displayUsage: vi.fn() };
    const mockUseCase = { analyze: vi.fn() };
    const mockController = { handle: vi.fn() };

    vi.mocked(NodeCliAdapter).mockImplementation(() => mockProcessAdapter as any);
    vi.mocked(EnvDisplayConfigAdapter).mockImplementation(() => mockDisplayConfig as any);
    vi.mocked(CliArgsValidation).mockImplementation(() => mockValidator as any);
    vi.mocked(CliViolationPresenter).mockImplementation(() => mockPresenter as any);
    vi.mocked(makeAnalyzeCodebaseUseCase).mockImplementation(() => mockUseCase as any);
    vi.mocked(CliController).mockImplementation(() => mockController as any);

    const result = makeCliController();

    // Verify EnvDisplayConfigAdapter was created with NodeCliAdapter instance
    expect(EnvDisplayConfigAdapter).toHaveBeenCalledWith(mockProcessAdapter);

    // Verify CliViolationPresenter was created with EnvDisplayConfigAdapter instance
    expect(CliViolationPresenter).toHaveBeenCalledWith(mockDisplayConfig);

    // Verify the controller was created with the correct instances
    const [useCaseArg, validatorArg, argsProviderArg, exitHandlerArg, presenterArg] =
      vi.mocked(CliController).mock.calls[0];

    expect(useCaseArg).toEqual(mockUseCase);
    expect(validatorArg).toEqual(mockValidator);
    expect(argsProviderArg).toEqual(mockProcessAdapter);
    expect(exitHandlerArg).toEqual(mockProcessAdapter);
    expect(presenterArg).toEqual(mockPresenter);

    // Verify the returned interface
    expect(result).toEqual(mockController);
  });

  it('should pass the same NodeCliAdapter instance for both IProcessArgsProvider and IProcessExitHandler', () => {
    const mockProcessAdapter = { getArgs: vi.fn(), exit: vi.fn(), getEnv: vi.fn() };
    vi.mocked(NodeCliAdapter).mockImplementation(() => mockProcessAdapter as any);

    makeCliController();

    const [, , argsProviderArg, exitHandlerArg] = vi.mocked(CliController).mock.calls[0];

    // Both should be the same instance (ISP principle)
    expect(argsProviderArg).toBe(exitHandlerArg);
    expect(argsProviderArg).toEqual(mockProcessAdapter);
  });

  it('should return an object conforming to controller interface', () => {
    const mockUseCase = { analyze: vi.fn() };
    const mockController = {
      handle: vi.fn().mockResolvedValue(undefined)
    };

    vi.mocked(makeAnalyzeCodebaseUseCase).mockReturnValue(mockUseCase as any);
    vi.mocked(CliController).mockImplementation(() => mockController as any);

    const result = makeCliController();

    expect(typeof result.handle).toBe('function');
  });

  it('should create new instances each time the factory is called', () => {
    const mockUseCase = { analyze: vi.fn() };
    vi.mocked(makeAnalyzeCodebaseUseCase).mockReturnValue(mockUseCase as any);
    vi.mocked(CliController).mockImplementation(() => ({
      handle: vi.fn()
    }) as any);

    const instance1 = makeCliController();
    const instance2 = makeCliController();

    // Should create new instances each time
    expect(NodeCliAdapter).toHaveBeenCalledTimes(2);
    expect(EnvDisplayConfigAdapter).toHaveBeenCalledTimes(2);
    expect(CliArgsValidation).toHaveBeenCalledTimes(2);
    expect(CliViolationPresenter).toHaveBeenCalledTimes(2);
    expect(makeAnalyzeCodebaseUseCase).toHaveBeenCalledTimes(2);
    expect(CliController).toHaveBeenCalledTimes(2);

    // Instances should be different
    expect(instance1).not.toBe(instance2);
  });
});

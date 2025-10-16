import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CliController } from '../../src/presentation/controllers/cli.controller';
import { makeAnalyzeCodebaseUseCase } from '../../src/main/factories/analyze-codebase.factory';

// Mock the modules
vi.mock('../../src/presentation/controllers/cli.controller', () => ({
  CliController: vi.fn().mockImplementation(() => ({
    handle: vi.fn()
  }))
}));

vi.mock('../../src/main/factories/analyze-codebase.factory', () => ({
  makeAnalyzeCodebaseUseCase: vi.fn()
}));

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

describe('Main Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should bootstrap the application and handle CLI commands', async () => {
    const mockUseCase = { analyze: vi.fn() };
    const mockHandle = vi.fn();
    const mockController = { handle: mockHandle };

    vi.mocked(makeAnalyzeCodebaseUseCase).mockReturnValue(mockUseCase);
    vi.mocked(CliController).mockImplementation(() => mockController);

    // Import and run the server
    await import('../../src/main/server');

    // Wait for async execution
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(makeAnalyzeCodebaseUseCase).toHaveBeenCalled();
    expect(CliController).toHaveBeenCalledWith(mockUseCase);
    expect(mockHandle).toHaveBeenCalledWith(process);
  });

  it('should handle fatal errors gracefully', async () => {
    const error = new Error('Fatal error');
    const mockHandle = vi.fn().mockRejectedValue(error);
    const mockController = { handle: mockHandle };

    vi.mocked(makeAnalyzeCodebaseUseCase).mockReturnValue({ analyze: vi.fn() });
    vi.mocked(CliController).mockImplementation(() => mockController);

    // Clear module cache to re-import
    vi.resetModules();

    // Re-mock after reset
    vi.mock('../../src/presentation/controllers/cli.controller', () => ({
      CliController: vi.fn().mockImplementation(() => ({
        handle: mockHandle
      }))
    }));

    vi.mock('../../src/main/factories/analyze-codebase.factory', () => ({
      makeAnalyzeCodebaseUseCase: vi.fn(() => ({ analyze: vi.fn() }))
    }));

    // Import and run the server
    await import('../../src/main/server');

    // Wait for async execution and rejection
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockConsoleError).toHaveBeenCalledWith('Fatal error:', error);
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
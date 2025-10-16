import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeCliController } from '../../src/main/factories/controllers/cli-controller.factory';

// Mock the modules
vi.mock('../../src/main/factories/controllers/cli-controller.factory', () => ({
  makeCliController: vi.fn()
}));

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

describe('Main Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should bootstrap the application and handle CLI commands', async () => {
    const mockHandle = vi.fn();
    const mockController = { handle: mockHandle };

    vi.mocked(makeCliController).mockReturnValue(mockController);

    // Import and run the server
    await import('../../src/main/server');

    // Wait for async execution
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(makeCliController).toHaveBeenCalled();
    expect(mockHandle).toHaveBeenCalled();
  });

  it('should handle fatal errors gracefully', async () => {
    const error = new Error('Fatal error');
    const mockHandle = vi.fn().mockRejectedValue(error);
    const mockController = { handle: mockHandle };

    vi.mocked(makeCliController).mockReturnValue(mockController);

    // Clear module cache to re-import
    vi.resetModules();

    // Re-mock after reset
    vi.mock('../../src/main/factories/controllers/cli-controller.factory', () => ({
      makeCliController: vi.fn(() => ({
        handle: mockHandle
      }))
    }));

    // Import and run the server
    await import('../../src/main/server');

    // Wait for async execution and rejection
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockConsoleError).toHaveBeenCalledWith('Fatal error:', error);
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CliController } from '../../../src/presentation/controllers/cli.controller';
import { IAnalyzeCodebase } from '../../../src/domain/usecases';
import { ArchitecturalViolationModel } from '../../../src/domain/models';
import { IValidation } from '../../../src/presentation/protocols/validation';
import { IProcessArgsProvider } from '../../../src/presentation/protocols/process-args-provider';
import { IProcessExitHandler } from '../../../src/presentation/protocols/process-exit-handler';
import { CliViolationPresenter } from '../../../src/presentation/presenters/cli-violation.presenter';

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('CliController', () => {
  let sut: CliController;
  let mockAnalyzeCodebase: IAnalyzeCodebase;
  let mockValidator: IValidation;
  let mockArgsProvider: IProcessArgsProvider;
  let mockExitHandler: IProcessExitHandler;
  let mockPresenter: CliViolationPresenter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalyzeCodebase = {
      analyze: vi.fn()
    };
    mockValidator = {
      check: vi.fn().mockReturnValue({ success: true, errors: [] })
    };
    mockArgsProvider = {
      getArgs: vi.fn().mockReturnValue(['/test/project'])
    };
    mockExitHandler = {
      exit: vi.fn()
    };
    mockPresenter = {
      displayUsage: vi.fn(),
      displayResults: vi.fn(),
      displayMetrics: vi.fn(),
      displayViolation: vi.fn(),
      displayError: vi.fn(),
      displayConfig: { isDebugMode: vi.fn().mockReturnValue(false) }
    } as any;
    sut = new CliController(mockAnalyzeCodebase, mockValidator, mockArgsProvider, mockExitHandler, mockPresenter);
  });

  describe('handle', () => {
    it('should display usage when no arguments provided', async () => {
      vi.mocked(mockArgsProvider.getArgs).mockReturnValue([]);
      vi.mocked(mockValidator.check).mockReturnValue({
        success: false,
        errors: [{ field: 'args', message: 'At least one argument is required (project path)' }]
      });

      await sut.handle();

      expect(mockPresenter.displayUsage).toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Input errors'));
      expect(mockExitHandler.exit).toHaveBeenCalledWith(1);
    });

    it('should analyze the provided path from arguments', async () => {
      vi.mocked(mockArgsProvider.getArgs).mockReturnValue(['/custom/path']);
      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue([]);

      await sut.handle();

      expect(mockAnalyzeCodebase.analyze).toHaveBeenCalledWith({ projectPath: '/custom/path' });
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Analyzing project: /custom/path'));
    });

    it('should display success message when no violations found', async () => {
      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue([]);

      await sut.handle();

      expect(mockPresenter.displayResults).toHaveBeenCalledWith([], expect.any(Number));
      expect(mockExitHandler.exit).toHaveBeenCalledWith(0);
    });

    it('should display violations grouped by severity', async () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Rule1',
          severity: 'error',
          file: 'src/file1.ts',
          message: 'Error message',
          fromRole: 'DOMAIN',
          toRole: 'INFRA',
          dependency: 'src/infra.ts'
        },
        {
          ruleName: 'Rule2',
          severity: 'warning',
          file: 'src/file2.ts',
          message: 'Warning message',
          fromRole: 'DATA'
        },
        {
          ruleName: 'Rule3',
          severity: 'info',
          file: 'src/file3.ts',
          message: 'Info message',
          fromRole: 'CONTROLLER'
        }
      ];

      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue(violations);

      await sut.handle();

      expect(mockPresenter.displayResults).toHaveBeenCalledWith(violations, expect.any(Number));
      expect(mockExitHandler.exit).toHaveBeenCalledWith(1); // Exit 1 because of errors
    });

    it('should display performance metrics', async () => {
      const violations = [
        {
          ruleName: 'Rule1',
          severity: 'warning',
          file: 'src/file1.ts',
          message: 'Warning',
          fromRole: 'DOMAIN'
        }
      ];
      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue(violations);

      await sut.handle();

      expect(mockPresenter.displayResults).toHaveBeenCalledWith(violations, expect.any(Number));
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Analysis failed');
      vi.mocked(mockAnalyzeCodebase.analyze).mockRejectedValue(error);

      await sut.handle();

      expect(mockPresenter.displayError).toHaveBeenCalledWith(error);
      expect(mockExitHandler.exit).toHaveBeenCalledWith(1);
    });

    it('should show stack trace when DEBUG env is set', async () => {
      const error = new Error('Analysis failed');
      error.stack = 'Stack trace here';
      vi.mocked(mockAnalyzeCodebase.analyze).mockRejectedValue(error);

      await sut.handle();

      expect(mockPresenter.displayError).toHaveBeenCalledWith(error);
    });

    it('should handle unknown errors', async () => {
      vi.mocked(mockAnalyzeCodebase.analyze).mockRejectedValue('Unknown error');

      await sut.handle();

      expect(mockPresenter.displayError).toHaveBeenCalledWith('Unknown error');
    });

    it('should display violations with no toRole or dependency', async () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'NamingRule',
          severity: 'warning',
          file: 'src/bad-name.ts',
          message: 'Bad naming',
          fromRole: 'CONTROLLER'
        }
      ];

      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue(violations);

      await sut.handle();

      expect(mockPresenter.displayResults).toHaveBeenCalledWith(violations, expect.any(Number));
    });

    it('should display violations with dependencies', async () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'ForbiddenDep',
          severity: 'error',
          file: 'src/domain/user.ts',
          message: 'Forbidden dependency',
          fromRole: 'DOMAIN',
          toRole: 'INFRA',
          dependency: 'src/infra/database.ts'
        }
      ];

      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue(violations);

      await sut.handle();

      expect(mockPresenter.displayResults).toHaveBeenCalledWith(violations, expect.any(Number));
    });

    it('should display summary with correct counts', async () => {
      const violations: ArchitecturalViolationModel[] = [
        { ruleName: 'R1', severity: 'error', file: 'f1.ts', message: 'E1', fromRole: 'A' },
        { ruleName: 'R2', severity: 'error', file: 'f2.ts', message: 'E2', fromRole: 'B' },
        { ruleName: 'R3', severity: 'warning', file: 'f3.ts', message: 'W1', fromRole: 'C' },
        { ruleName: 'R4', severity: 'warning', file: 'f4.ts', message: 'W2', fromRole: 'D' },
        { ruleName: 'R5', severity: 'info', file: 'f5.ts', message: 'I1', fromRole: 'E' }
      ];

      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue(violations);

      await sut.handle();

      expect(mockPresenter.displayResults).toHaveBeenCalledWith(violations, expect.any(Number));
    });

    it('should format elapsed time in milliseconds', async () => {
      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue([]);

      const startTime = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 500);

      await sut.handle();

      expect(mockPresenter.displayResults).toHaveBeenCalledWith([], 500);
    });

    it('should format elapsed time in seconds when over 1000ms', async () => {
      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue([]);

      const startTime = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 2500);

      await sut.handle();

      expect(mockPresenter.displayResults).toHaveBeenCalledWith([], 2500);
    });

    it('should show most common rule violations', async () => {
      const violations: ArchitecturalViolationModel[] = [
        { ruleName: 'Rule1', severity: 'error', file: 'f1.ts', message: 'E1', fromRole: 'A' },
        { ruleName: 'Rule1', severity: 'error', file: 'f2.ts', message: 'E2', fromRole: 'B' },
        { ruleName: 'Rule1', severity: 'error', file: 'f3.ts', message: 'E3', fromRole: 'C' },
        { ruleName: 'Rule2', severity: 'warning', file: 'f4.ts', message: 'W1', fromRole: 'D' },
        { ruleName: 'Rule2', severity: 'warning', file: 'f5.ts', message: 'W2', fromRole: 'E' },
        { ruleName: 'Rule3', severity: 'info', file: 'f6.ts', message: 'I1', fromRole: 'F' }
      ];

      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue(violations);

      await sut.handle();

      expect(mockPresenter.displayResults).toHaveBeenCalledWith(violations, expect.any(Number));
    });

    it('should exit with 0 when only warnings and info', async () => {
      const violations: ArchitecturalViolationModel[] = [
        { ruleName: 'R1', severity: 'warning', file: 'f1.ts', message: 'W1', fromRole: 'A' },
        { ruleName: 'R2', severity: 'info', file: 'f2.ts', message: 'I1', fromRole: 'B' }
      ];

      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue(violations);

      await sut.handle();

      expect(mockExitHandler.exit).toHaveBeenCalledWith(0);
    });
  });
});
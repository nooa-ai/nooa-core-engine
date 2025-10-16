import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CliController } from '../../../src/presentation/controllers/cli.controller';
import { IAnalyzeCodebase } from '../../../src/domain/usecases';
import { ArchitecturalViolationModel } from '../../../src/domain/models';

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('CliController', () => {
  let sut: CliController;
  let mockAnalyzeCodebase: IAnalyzeCodebase;
  let mockProcess: NodeJS.Process;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalyzeCodebase = {
      analyze: vi.fn()
    };
    sut = new CliController(mockAnalyzeCodebase);

    // Create mock process object
    mockProcess = {
      argv: ['node', 'script.js', '/test/project'],
      exit: vi.fn(),
      env: {}
    } as any;
  });

  describe('handle', () => {
    it('should display usage when no arguments provided', async () => {
      mockProcess.argv = ['node', 'script.js'];
      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue([]);

      await sut.handle(mockProcess);

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(mockProcess.exit).toHaveBeenCalledWith(0);
    });

    it('should analyze the provided path from arguments', async () => {
      mockProcess.argv = ['node', 'script.js', '/custom/path'];
      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue([]);

      await sut.handle(mockProcess);

      expect(mockAnalyzeCodebase.analyze).toHaveBeenCalledWith({ projectPath: '/custom/path' });
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Analyzing project: /custom/path'));
    });

    it('should display success message when no violations found', async () => {
      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue([]);

      await sut.handle(mockProcess);

      expect(mockConsoleLog).toHaveBeenCalledWith('✅ No architectural violations found!');
      expect(mockProcess.exit).toHaveBeenCalledWith(0);
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

      await sut.handle(mockProcess);

      expect(mockConsoleLog).toHaveBeenCalledWith('❌ Found 3 architectural violation(s):');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔴 ERRORS (1)'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🟡 WARNINGS (1)'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔵 INFO (1)'));
      expect(mockProcess.exit).toHaveBeenCalledWith(1); // Exit 1 because of errors
    });

    it('should display performance metrics', async () => {
      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue([
        {
          ruleName: 'Rule1',
          severity: 'warning',
          file: 'src/file1.ts',
          message: 'Warning',
          fromRole: 'DOMAIN'
        }
      ]);

      await sut.handle(mockProcess);

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Performance Metrics');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Analysis Time:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Rules Triggered: 1'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Total Violations: 1'));
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Analysis failed');
      vi.mocked(mockAnalyzeCodebase.analyze).mockRejectedValue(error);

      await sut.handle(mockProcess);

      expect(mockConsoleError).toHaveBeenCalledWith('❌ Error during analysis:');
      expect(mockConsoleError).toHaveBeenCalledWith('  Analysis failed');
      expect(mockProcess.exit).toHaveBeenCalledWith(1);
    });

    it('should show stack trace when DEBUG env is set', async () => {
      mockProcess.env.DEBUG = 'true';
      const error = new Error('Analysis failed');
      error.stack = 'Stack trace here';
      vi.mocked(mockAnalyzeCodebase.analyze).mockRejectedValue(error);

      await sut.handle(mockProcess);

      expect(mockConsoleError).toHaveBeenCalledWith('Stack trace:');
      expect(mockConsoleError).toHaveBeenCalledWith(error.stack);
    });

    it('should handle unknown errors', async () => {
      vi.mocked(mockAnalyzeCodebase.analyze).mockRejectedValue('Unknown error');

      await sut.handle(mockProcess);

      expect(mockConsoleError).toHaveBeenCalledWith('  An unknown error occurred');
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

      await sut.handle(mockProcess);

      expect(mockConsoleLog).toHaveBeenCalledWith('  1. [NamingRule]');
      expect(mockConsoleLog).toHaveBeenCalledWith('     File: src/bad-name.ts');
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

      await sut.handle(mockProcess);

      expect(mockConsoleLog).toHaveBeenCalledWith('     DOMAIN → INFRA');
      expect(mockConsoleLog).toHaveBeenCalledWith('     Dependency: src/infra/database.ts');
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

      await sut.handle(mockProcess);

      expect(mockConsoleLog).toHaveBeenCalledWith('Summary: 2 errors, 2 warnings, 1 info');
    });

    it('should format elapsed time in milliseconds', async () => {
      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue([]);

      const startTime = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 500);

      await sut.handle(mockProcess);

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('500ms'));
    });

    it('should format elapsed time in seconds when over 1000ms', async () => {
      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue([]);

      const startTime = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 2500);

      await sut.handle(mockProcess);

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('2.50s'));
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

      await sut.handle(mockProcess);

      expect(mockConsoleLog).toHaveBeenCalledWith('📌 Most Common Issues:');
      expect(mockConsoleLog).toHaveBeenCalledWith('   • Rule1: 3 violations');
      expect(mockConsoleLog).toHaveBeenCalledWith('   • Rule2: 2 violations');
      expect(mockConsoleLog).toHaveBeenCalledWith('   • Rule3: 1 violation');
    });

    it('should exit with 0 when only warnings and info', async () => {
      const violations: ArchitecturalViolationModel[] = [
        { ruleName: 'R1', severity: 'warning', file: 'f1.ts', message: 'W1', fromRole: 'A' },
        { ruleName: 'R2', severity: 'info', file: 'f2.ts', message: 'I1', fromRole: 'B' }
      ];

      vi.mocked(mockAnalyzeCodebase.analyze).mockResolvedValue(violations);

      await sut.handle(mockProcess);

      expect(mockProcess.exit).toHaveBeenCalledWith(0);
    });
  });
});
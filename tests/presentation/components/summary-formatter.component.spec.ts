import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SummaryFormatterComponent } from '../../../src/presentation/components/summary-formatter.component';
import { ViolationFormatterComponent } from '../../../src/presentation/components/violation-formatter.component';
import { ArchitecturalViolationModel } from '../../../src/domain/models';

describe('SummaryFormatterComponent', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let violationFormatter: ViolationFormatterComponent;
  let violationFormatterDisplaySpy: ReturnType<typeof vi.spyOn>;
  let sut: SummaryFormatterComponent;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    violationFormatter = new ViolationFormatterComponent();
    violationFormatterDisplaySpy = vi.spyOn(violationFormatter, 'display').mockImplementation(() => {});
    sut = new SummaryFormatterComponent(violationFormatter);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    violationFormatterDisplaySpy.mockRestore();
  });

  describe('display', () => {
    it('should display errors section with count', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Error-Rule',
          severity: 'error',
          file: 'file1.ts',
          message: 'Error message',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(consoleLogSpy).toHaveBeenCalledWith('🔴 ERRORS (1):');
    });

    it('should display warnings section with count', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Warning-Rule',
          severity: 'warning',
          file: 'file1.ts',
          message: 'Warning message',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(consoleLogSpy).toHaveBeenCalledWith('🟡 WARNINGS (1):');
    });

    it('should display info section with count', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Info-Rule',
          severity: 'info',
          file: 'file1.ts',
          message: 'Info message',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(consoleLogSpy).toHaveBeenCalledWith('🔵 INFO (1):');
    });

    it('should group violations by severity correctly', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Error-Rule',
          severity: 'error',
          file: 'file1.ts',
          message: 'Error',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Warning-Rule',
          severity: 'warning',
          file: 'file2.ts',
          message: 'Warning',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Error-Rule-2',
          severity: 'error',
          file: 'file3.ts',
          message: 'Error 2',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Info-Rule',
          severity: 'info',
          file: 'file4.ts',
          message: 'Info',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(consoleLogSpy).toHaveBeenCalledWith('🔴 ERRORS (2):');
      expect(consoleLogSpy).toHaveBeenCalledWith('🟡 WARNINGS (1):');
      expect(consoleLogSpy).toHaveBeenCalledWith('🔵 INFO (1):');
    });

    it('should not display errors section when no errors', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Warning-Rule',
          severity: 'warning',
          file: 'file1.ts',
          message: 'Warning',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('🔴 ERRORS'));
    });

    it('should not display warnings section when no warnings', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Error-Rule',
          severity: 'error',
          file: 'file1.ts',
          message: 'Error',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('🟡 WARNINGS'));
    });

    it('should not display info section when no infos', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Error-Rule',
          severity: 'error',
          file: 'file1.ts',
          message: 'Error',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('🔵 INFO'));
    });

    it('should display summary line with counts', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Error-Rule',
          severity: 'error',
          file: 'file1.ts',
          message: 'Error',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Warning-Rule',
          severity: 'warning',
          file: 'file2.ts',
          message: 'Warning',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Info-Rule',
          severity: 'info',
          file: 'file3.ts',
          message: 'Info',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(consoleLogSpy).toHaveBeenCalledWith('Summary: 1 errors, 1 warnings, 1 info');
    });

    it('should display separator before summary', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Error-Rule',
          severity: 'error',
          file: 'file1.ts',
          message: 'Error',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(consoleLogSpy).toHaveBeenCalledWith('='.repeat(50));
    });

    it('should call violationFormatter.display for each error with correct index', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Error-1',
          severity: 'error',
          file: 'file1.ts',
          message: 'Error 1',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Error-2',
          severity: 'error',
          file: 'file2.ts',
          message: 'Error 2',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(violationFormatterDisplaySpy).toHaveBeenCalledWith(violations[0], 1);
      expect(violationFormatterDisplaySpy).toHaveBeenCalledWith(violations[1], 2);
    });

    it('should call violationFormatter.display for each warning with correct index', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Warning-1',
          severity: 'warning',
          file: 'file1.ts',
          message: 'Warning 1',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Warning-2',
          severity: 'warning',
          file: 'file2.ts',
          message: 'Warning 2',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(violationFormatterDisplaySpy).toHaveBeenCalledWith(violations[0], 1);
      expect(violationFormatterDisplaySpy).toHaveBeenCalledWith(violations[1], 2);
    });

    it('should call violationFormatter.display for each info with correct index', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Info-1',
          severity: 'info',
          file: 'file1.ts',
          message: 'Info 1',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Info-2',
          severity: 'info',
          file: 'file2.ts',
          message: 'Info 2',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      expect(violationFormatterDisplaySpy).toHaveBeenCalledWith(violations[0], 1);
      expect(violationFormatterDisplaySpy).toHaveBeenCalledWith(violations[1], 2);
    });

    it('should display empty line after each severity section', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Error-Rule',
          severity: 'error',
          file: 'file1.ts',
          message: 'Error',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Warning-Rule',
          severity: 'warning',
          file: 'file2.ts',
          message: 'Warning',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations);

      // Empty line after errors section and after warnings section
      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });

    it('should handle empty violations array', () => {
      sut.display([]);

      expect(consoleLogSpy).toHaveBeenCalledWith('='.repeat(50));
      expect(consoleLogSpy).toHaveBeenCalledWith('Summary: 0 errors, 0 warnings, 0 info');
      expect(violationFormatterDisplaySpy).not.toHaveBeenCalled();
    });
  });
});

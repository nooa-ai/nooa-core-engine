import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetricsFormatterComponent } from '../../../src/presentation/components/metrics-formatter.component';
import { ArchitecturalViolationModel } from '../../../src/domain/models';

describe('MetricsFormatterComponent', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let sut: MetricsFormatterComponent;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    sut = new MetricsFormatterComponent();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('display', () => {
    it('should display metrics header and footer', () => {
      sut.display([], 500);

      expect(consoleLogSpy).toHaveBeenCalledWith('📊 Performance Metrics');
      expect(consoleLogSpy).toHaveBeenCalledWith('─'.repeat(50));
    });

    it('should format time as milliseconds when less than 1 second', () => {
      sut.display([], 500);

      expect(consoleLogSpy).toHaveBeenCalledWith('⏱️  Analysis Time: 500ms');
    });

    it('should format time as seconds when 1 second or more', () => {
      sut.display([], 1500);

      expect(consoleLogSpy).toHaveBeenCalledWith('⏱️  Analysis Time: 1.50s');
    });

    it('should format time with 2 decimal places for seconds', () => {
      sut.display([], 3456);

      expect(consoleLogSpy).toHaveBeenCalledWith('⏱️  Analysis Time: 3.46s');
    });

    it('should not display violation stats when violations array is empty', () => {
      sut.display([], 500);

      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Rules Triggered'));
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Total Violations'));
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Most Common Issues'));
    });

    it('should display rules triggered and total violations count', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'File-Size-Warning',
          severity: 'warning',
          file: 'file1.ts',
          message: 'Test',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'File-Size-Warning',
          severity: 'warning',
          file: 'file2.ts',
          message: 'Test',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'No-God-Objects',
          severity: 'error',
          file: 'file3.ts',
          message: 'Test',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations, 500);

      expect(consoleLogSpy).toHaveBeenCalledWith('📋 Rules Triggered: 2');
      expect(consoleLogSpy).toHaveBeenCalledWith('🔍 Total Violations: 3');
    });

    it('should display most common issues with counts', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'File-Size-Warning',
          severity: 'warning',
          file: 'file1.ts',
          message: 'Test',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'File-Size-Warning',
          severity: 'warning',
          file: 'file2.ts',
          message: 'Test',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'No-God-Objects',
          severity: 'error',
          file: 'file3.ts',
          message: 'Test',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations, 500);

      expect(consoleLogSpy).toHaveBeenCalledWith('📌 Most Common Issues:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • File-Size-Warning: 2 violations');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • No-God-Objects: 1 violation');
    });

    it('should use singular "violation" for count of 1', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Test-Rule',
          severity: 'error',
          file: 'file1.ts',
          message: 'Test',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.display(violations, 500);

      expect(consoleLogSpy).toHaveBeenCalledWith('   • Test-Rule: 1 violation');
    });

    it('should limit most common issues to top 3', () => {
      const violations: ArchitecturalViolationModel[] = [
        { ruleName: 'Rule-A', severity: 'error', file: 'file1.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'Rule-A', severity: 'error', file: 'file2.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'Rule-A', severity: 'error', file: 'file3.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'Rule-A', severity: 'error', file: 'file4.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'Rule-B', severity: 'error', file: 'file5.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'Rule-B', severity: 'error', file: 'file6.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'Rule-B', severity: 'error', file: 'file7.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'Rule-C', severity: 'error', file: 'file8.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'Rule-C', severity: 'error', file: 'file9.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'Rule-D', severity: 'error', file: 'file10.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
      ];

      sut.display(violations, 500);

      // Should only show top 3
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Rule-A: 4 violations');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Rule-B: 3 violations');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Rule-C: 2 violations');
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Rule-D'));
    });

    it('should sort rules by count in descending order', () => {
      const violations: ArchitecturalViolationModel[] = [
        { ruleName: 'Low-Count', severity: 'error', file: 'file1.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'High-Count', severity: 'error', file: 'file2.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'High-Count', severity: 'error', file: 'file3.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'High-Count', severity: 'error', file: 'file4.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'Mid-Count', severity: 'error', file: 'file5.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
        { ruleName: 'Mid-Count', severity: 'error', file: 'file6.ts', message: 'Test', fromRole: undefined, toRole: undefined, dependency: undefined },
      ];

      sut.display(violations, 500);

      const calls = consoleLogSpy.mock.calls.map((call) => call[0]);
      const highCountIndex = calls.findIndex((call) => call.includes('High-Count'));
      const midCountIndex = calls.findIndex((call) => call.includes('Mid-Count'));
      const lowCountIndex = calls.findIndex((call) => call.includes('Low-Count'));

      expect(highCountIndex).toBeLessThan(midCountIndex);
      expect(midCountIndex).toBeLessThan(lowCountIndex);
    });
  });
});

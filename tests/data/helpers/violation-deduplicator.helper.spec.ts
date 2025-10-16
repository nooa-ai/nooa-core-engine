import { describe, it, expect, beforeEach } from 'vitest';
import { ViolationDeduplicatorHelper } from '../../../src/data/helpers/violation-deduplicator.helper';
import { ArchitecturalViolationModel } from '../../../src/domain/models';

describe('ViolationDeduplicatorHelper', () => {
  let sut: ViolationDeduplicatorHelper;

  beforeEach(() => {
    sut = new ViolationDeduplicatorHelper();
  });

  describe('deduplicate', () => {
    it('should return empty array when given empty array', () => {
      const result = sut.deduplicate([]);

      expect(result).toEqual([]);
    });

    it('should return same array when no duplicates', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'File-Size-Error',
          severity: 'error',
          file: 'file1.ts',
          message: 'File has 300 lines',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'File-Size-Error',
          severity: 'error',
          file: 'file2.ts',
          message: 'File has 250 lines',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      const result = sut.deduplicate(violations);

      expect(result).toHaveLength(2);
      expect(result).toEqual(violations);
    });

    it('should remove duplicate violations for same file + rule + message', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'File-Size-Error',
          severity: 'error',
          file: 'file1.ts',
          message: 'File has 300 lines',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'File-Size-Error',
          severity: 'error',
          file: 'file1.ts',
          message: 'File has 300 lines',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'File-Size-Error',
          severity: 'error',
          file: 'file1.ts',
          message: 'File has 300 lines',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      const result = sut.deduplicate(violations);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(violations[0]);
    });

    it('should keep first occurrence when duplicates exist', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Test-Rule',
          severity: 'error',
          file: 'file1.ts',
          message: 'Test message',
          fromRole: 'DOMAIN',
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Test-Rule',
          severity: 'error',
          file: 'file1.ts',
          message: 'Test message',
          fromRole: 'USECASE', // Different fromRole but same file + rule + message
          toRole: undefined,
          dependency: undefined,
        },
      ];

      const result = sut.deduplicate(violations);

      expect(result).toHaveLength(1);
      expect(result[0].fromRole).toBe('DOMAIN'); // First occurrence
    });

    it('should preserve multiple violations from same rule with different messages', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'class_complexity',
          severity: 'error',
          file: 'god-object.ts',
          message: 'Class has 20 public methods (exceeds 10)',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'class_complexity',
          severity: 'error',
          file: 'god-object.ts',
          message: 'Class has 30 properties (exceeds 15)',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      const result = sut.deduplicate(violations);

      expect(result).toHaveLength(2);
      expect(result).toEqual(violations);
    });

    it('should handle multiple files with same rule and message', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'File-Size-Warning',
          severity: 'warning',
          file: 'file1.ts',
          message: 'File has 150 lines',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'File-Size-Warning',
          severity: 'warning',
          file: 'file2.ts',
          message: 'File has 150 lines',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'File-Size-Warning',
          severity: 'warning',
          file: 'file1.ts',
          message: 'File has 150 lines',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      const result = sut.deduplicate(violations);

      expect(result).toHaveLength(2);
      expect(result[0].file).toBe('file1.ts');
      expect(result[1].file).toBe('file2.ts');
    });

    it('should handle violations with different severity but same file + rule + message', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Test-Rule',
          severity: 'error',
          file: 'file1.ts',
          message: 'Test message',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Test-Rule',
          severity: 'warning', // Different severity
          file: 'file1.ts',
          message: 'Test message',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      const result = sut.deduplicate(violations);

      // Should still deduplicate because key is file + ruleName + message
      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe('error'); // First occurrence
    });

    it('should handle real-world scenario with 24 exports in same file', () => {
      const violations: ArchitecturalViolationModel[] = Array(24)
        .fill(null)
        .map(() => ({
          ruleName: 'File-Size-Error',
          severity: 'error' as const,
          file: 'architectural-rule.model.ts',
          message: 'File-Size-Error: 308 lines',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        }));

      const result = sut.deduplicate(violations);

      expect(result).toHaveLength(1);
      expect(result[0].file).toBe('architectural-rule.model.ts');
    });

    it('should maintain order of first occurrences', () => {
      const violations: ArchitecturalViolationModel[] = [
        {
          ruleName: 'Rule-A',
          severity: 'error',
          file: 'file1.ts',
          message: 'Message A',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Rule-B',
          severity: 'warning',
          file: 'file2.ts',
          message: 'Message B',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Rule-A',
          severity: 'error',
          file: 'file1.ts',
          message: 'Message A',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
        {
          ruleName: 'Rule-C',
          severity: 'info',
          file: 'file3.ts',
          message: 'Message C',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      const result = sut.deduplicate(violations);

      expect(result).toHaveLength(3);
      expect(result[0].ruleName).toBe('Rule-A');
      expect(result[1].ruleName).toBe('Rule-B');
      expect(result[2].ruleName).toBe('Rule-C');
    });
  });
});

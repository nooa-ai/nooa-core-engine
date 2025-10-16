import { describe, it, expect, beforeEach } from 'vitest';
import { CliArgsValidation } from '../../../src/validation/validators/cli-args-validation';

describe('CliArgsValidation', () => {
  let sut: CliArgsValidation;

  beforeEach(() => {
    sut = new CliArgsValidation();
  });

  describe('check', () => {
    it('should return success when args array has valid project path', () => {
      const input = { args: ['./my-project'] };

      const result = sut.check(input);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return success when args array has multiple arguments', () => {
      const input = { args: ['./my-project', '--verbose', '--debug'] };

      const result = sut.check(input);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return error when input is null', () => {
      const result = sut.check(null);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input');
      expect(result.errors[0].message).toBe('Input must be an object');
    });

    it('should return error when input is undefined', () => {
      const result = sut.check(undefined);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input');
      expect(result.errors[0].message).toBe('Input must be an object');
    });

    it('should return error when input is not an object', () => {
      const result = sut.check('string');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input');
      expect(result.errors[0].message).toBe('Input must be an object');
    });

    it('should return error when input is a number', () => {
      const result = sut.check(123);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input');
      expect(result.errors[0].message).toBe('Input must be an object');
    });

    it('should return error when args field is missing', () => {
      const input = { otherField: 'value' };

      const result = sut.check(input);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('args');
      expect(result.errors[0].message).toBe('Arguments array is required');
    });

    it('should return error when args is not an array', () => {
      const input = { args: 'not-an-array' };

      const result = sut.check(input);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('args');
      expect(result.errors[0].message).toBe('Arguments must be an array');
    });

    it('should return error when args is an object', () => {
      const input = { args: { path: './project' } };

      const result = sut.check(input);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('args');
      expect(result.errors[0].message).toBe('Arguments must be an array');
    });

    it('should return error when args array is empty', () => {
      const input = { args: [] };

      const result = sut.check(input);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('args');
      expect(result.errors[0].message).toBe('At least one argument is required (project path)');
    });

    it('should return error when project path is empty string', () => {
      const input = { args: [''] };

      const result = sut.check(input);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('projectPath');
      expect(result.errors[0].message).toBe('Project path cannot be empty');
    });

    it('should return error when project path is only whitespace', () => {
      const input = { args: ['   '] };

      const result = sut.check(input);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('projectPath');
      expect(result.errors[0].message).toBe('Project path cannot be empty');
    });

    it('should return error when project path is only tabs', () => {
      const input = { args: ['\t\t'] };

      const result = sut.check(input);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('projectPath');
      expect(result.errors[0].message).toBe('Project path cannot be empty');
    });

    it('should accept project path with valid characters', () => {
      const input = { args: ['./my-project-123'] };

      const result = sut.check(input);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept absolute path', () => {
      const input = { args: ['/usr/local/projects/my-project'] };

      const result = sut.check(input);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept relative path with parent directory', () => {
      const input = { args: ['../my-project'] };

      const result = sut.check(input);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept current directory', () => {
      const input = { args: ['.'] };

      const result = sut.check(input);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept path with spaces', () => {
      const input = { args: ['./my project'] };

      const result = sut.check(input);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should ignore additional arguments beyond project path', () => {
      const input = { args: ['./my-project', 'extra-arg-1', 'extra-arg-2'] };

      const result = sut.check(input);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});

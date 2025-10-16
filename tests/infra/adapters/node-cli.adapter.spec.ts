import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeCliAdapter } from '../../../src/infra/adapters/node-cli.adapter';

describe('NodeCliAdapter', () => {
  let mockProcess: NodeJS.Process;

  beforeEach(() => {
    mockProcess = {
      argv: ['node', '/path/to/script.js', 'arg1', 'arg2', 'arg3'],
      exit: vi.fn(),
      env: {
        NODE_ENV: 'test',
        DEBUG: '1',
        CUSTOM_VAR: 'value'
      }
    } as unknown as NodeJS.Process;
  });

  const makeSut = (runtime?: NodeJS.Process) => {
    const sut = new NodeCliAdapter(runtime || mockProcess);
    return { sut };
  };

  describe('getArgs', () => {
    it('should return arguments skipping first two (node and script path)', () => {
      const { sut } = makeSut();
      const result = sut.getArgs();
      expect(result).toEqual(['arg1', 'arg2', 'arg3']);
    });

    it('should return empty array when only node and script path provided', () => {
      mockProcess.argv = ['node', '/path/to/script.js'];
      const { sut } = makeSut();
      const result = sut.getArgs();
      expect(result).toEqual([]);
    });

    it('should return single argument correctly', () => {
      mockProcess.argv = ['node', '/path/to/script.js', 'only-arg'];
      const { sut } = makeSut();
      const result = sut.getArgs();
      expect(result).toEqual(['only-arg']);
    });

    it('should handle arguments with spaces', () => {
      mockProcess.argv = ['node', '/path/to/script.js', 'arg with spaces'];
      const { sut } = makeSut();
      const result = sut.getArgs();
      expect(result).toEqual(['arg with spaces']);
    });

    it('should handle arguments with special characters', () => {
      mockProcess.argv = ['node', '/path/to/script.js', '--flag=value', '-x'];
      const { sut } = makeSut();
      const result = sut.getArgs();
      expect(result).toEqual(['--flag=value', '-x']);
    });
  });

  describe('exit', () => {
    it('should call process.exit with code 0', () => {
      const { sut } = makeSut();
      sut.exit(0);
      expect(mockProcess.exit).toHaveBeenCalledWith(0);
    });

    it('should call process.exit with code 1', () => {
      const { sut } = makeSut();
      sut.exit(1);
      expect(mockProcess.exit).toHaveBeenCalledWith(1);
    });

    it('should call process.exit with custom error code', () => {
      const { sut } = makeSut();
      sut.exit(127);
      expect(mockProcess.exit).toHaveBeenCalledWith(127);
    });

    it('should call process.exit exactly once', () => {
      const { sut } = makeSut();
      sut.exit(0);
      expect(mockProcess.exit).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEnv', () => {
    it('should return environment variable value when it exists', () => {
      const { sut } = makeSut();
      const result = sut.getEnv('NODE_ENV');
      expect(result).toBe('test');
    });

    it('should return DEBUG environment variable', () => {
      const { sut } = makeSut();
      const result = sut.getEnv('DEBUG');
      expect(result).toBe('1');
    });

    it('should return custom environment variable', () => {
      const { sut } = makeSut();
      const result = sut.getEnv('CUSTOM_VAR');
      expect(result).toBe('value');
    });

    it('should return undefined when variable does not exist', () => {
      const { sut } = makeSut();
      const result = sut.getEnv('NON_EXISTENT');
      expect(result).toBeUndefined();
    });

    it('should handle empty string values', () => {
      mockProcess.env = { EMPTY: '' };
      const { sut } = makeSut();
      const result = sut.getEnv('EMPTY');
      expect(result).toBe('');
    });

    it('should be case-sensitive for variable names', () => {
      const { sut } = makeSut();
      const result = sut.getEnv('node_env'); // lowercase
      expect(result).toBeUndefined();
    });
  });

  describe('integration', () => {
    it('should work without passing runtime (uses global.process)', () => {
      const sut = new NodeCliAdapter();
      expect(sut).toBeDefined();
      expect(typeof sut.getArgs).toBe('function');
      expect(typeof sut.exit).toBe('function');
      expect(typeof sut.getEnv).toBe('function');
    });

    it('should implement IProcessArgsProvider', () => {
      const { sut } = makeSut();
      expect(sut.getArgs).toBeDefined();
    });

    it('should implement IProcessExitHandler', () => {
      const { sut } = makeSut();
      expect(sut.exit).toBeDefined();
    });

    it('should implement IProcessEnvProvider', () => {
      const { sut } = makeSut();
      expect(sut.getEnv).toBeDefined();
    });
  });
});

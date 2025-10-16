import { describe, it, expect, vi } from 'vitest';
import { EnvDisplayConfigAdapter } from '../../../src/infra/adapters/env-display-config.adapter';
import { IProcessEnvProvider } from '../../../src/data/protocols/process-env-provider';

describe('EnvDisplayConfigAdapter', () => {
  const makeSut = (debugValue?: string) => {
    const envProvider: IProcessEnvProvider = {
      getEnv: vi.fn((key: string) => {
        if (key === 'DEBUG') return debugValue;
        return undefined;
      })
    };
    const sut = new EnvDisplayConfigAdapter(envProvider);
    return { sut, envProvider };
  };

  describe('isDebugMode', () => {
    it('should return true when DEBUG env is set to "1"', () => {
      const { sut } = makeSut('1');
      expect(sut.isDebugMode()).toBe(true);
    });

    it('should return true when DEBUG env is set to "true"', () => {
      const { sut } = makeSut('true');
      expect(sut.isDebugMode()).toBe(true);
    });

    it('should return true when DEBUG env is set to any non-empty string', () => {
      const { sut } = makeSut('yes');
      expect(sut.isDebugMode()).toBe(true);
    });

    it('should return false when DEBUG env is not set', () => {
      const { sut } = makeSut(undefined);
      expect(sut.isDebugMode()).toBe(false);
    });

    it('should return false when DEBUG env is empty string', () => {
      const { sut } = makeSut('');
      expect(sut.isDebugMode()).toBe(false);
    });

    it('should return true when DEBUG env is "0" (non-empty string)', () => {
      const { sut } = makeSut('0');
      expect(sut.isDebugMode()).toBe(true);
    });

    it('should call envProvider.getEnv with "DEBUG"', () => {
      const { sut, envProvider } = makeSut('1');
      sut.isDebugMode();
      expect(envProvider.getEnv).toHaveBeenCalledWith('DEBUG');
    });
  });
});

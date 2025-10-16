import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorFormatterComponent } from '../../../src/presentation/components/error-formatter.component';
import { IDisplayConfigProvider } from '../../../src/presentation/protocols/display-config-provider';

describe('ErrorFormatterComponent', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const makeDisplayConfig = (isDebug: boolean): IDisplayConfigProvider => ({
    isDebugMode: () => isDebug,
  });

  describe('display', () => {
    it('should display error header and footer', () => {
      const displayConfig = makeDisplayConfig(false);
      const sut = new ErrorFormatterComponent(displayConfig);
      const error = new Error('Test error');

      sut.display(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('');
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error during analysis:');
    });

    it('should display error message when error is Error instance', () => {
      const displayConfig = makeDisplayConfig(false);
      const sut = new ErrorFormatterComponent(displayConfig);
      const error = new Error('Something went wrong');

      sut.display(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('  Something went wrong');
    });

    it('should display generic message when error is not Error instance', () => {
      const displayConfig = makeDisplayConfig(false);
      const sut = new ErrorFormatterComponent(displayConfig);

      sut.display('string error');

      expect(consoleErrorSpy).toHaveBeenCalledWith('  An unknown error occurred');
    });

    it('should display generic message when error is null', () => {
      const displayConfig = makeDisplayConfig(false);
      const sut = new ErrorFormatterComponent(displayConfig);

      sut.display(null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('  An unknown error occurred');
    });

    it('should display generic message when error is undefined', () => {
      const displayConfig = makeDisplayConfig(false);
      const sut = new ErrorFormatterComponent(displayConfig);

      sut.display(undefined);

      expect(consoleErrorSpy).toHaveBeenCalledWith('  An unknown error occurred');
    });

    it('should display stack trace when debug mode is enabled and error has stack', () => {
      const displayConfig = makeDisplayConfig(true);
      const sut = new ErrorFormatterComponent(displayConfig);
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at someFunction (file.ts:10:5)';

      sut.display(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Stack trace:');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Test error\n    at someFunction (file.ts:10:5)');
    });

    it('should not display stack trace when debug mode is disabled', () => {
      const displayConfig = makeDisplayConfig(false);
      const sut = new ErrorFormatterComponent(displayConfig);
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at someFunction (file.ts:10:5)';

      sut.display(error);

      expect(consoleErrorSpy).not.toHaveBeenCalledWith('Stack trace:');
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('at someFunction'));
    });

    it('should not display stack trace when error has no stack', () => {
      const displayConfig = makeDisplayConfig(true);
      const sut = new ErrorFormatterComponent(displayConfig);
      const error = new Error('Test error');
      error.stack = undefined;

      sut.display(error);

      expect(consoleErrorSpy).not.toHaveBeenCalledWith('Stack trace:');
    });

    it('should display error message even in debug mode', () => {
      const displayConfig = makeDisplayConfig(true);
      const sut = new ErrorFormatterComponent(displayConfig);
      const error = new Error('Critical error');

      sut.display(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('  Critical error');
    });

    it('should call displayConfig.isDebugMode when checking for stack trace display', () => {
      const displayConfig = {
        isDebugMode: vi.fn().mockReturnValue(true),
      };
      const sut = new ErrorFormatterComponent(displayConfig);
      const error = new Error('Test error');
      error.stack = 'Stack trace here';

      sut.display(error);

      expect(displayConfig.isDebugMode).toHaveBeenCalled();
    });

    it('should handle error objects without message property', () => {
      const displayConfig = makeDisplayConfig(false);
      const sut = new ErrorFormatterComponent(displayConfig);
      const error = { someProperty: 'value' };

      sut.display(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('  An unknown error occurred');
    });
  });
});

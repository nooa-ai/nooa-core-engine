import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UsageComponent } from '../../../src/presentation/components/usage.component';

describe('UsageComponent', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let sut: UsageComponent;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    sut = new UsageComponent();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('display', () => {
    it('should display usage instructions', () => {
      sut.display();

      expect(consoleLogSpy).toHaveBeenCalledWith('Nooa Core Engine - Architectural Grammar Validator');
      expect(consoleLogSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).toHaveBeenCalledWith('Usage:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  npm start <project-path>');
      expect(consoleLogSpy).toHaveBeenCalledWith('Example:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  npm start ./my-project');
      expect(consoleLogSpy).toHaveBeenCalledWith('The project must contain a nooa.grammar.yaml file at its root.');
    });

    it('should call console.log exactly 9 times', () => {
      sut.display();

      expect(consoleLogSpy).toHaveBeenCalledTimes(9);
    });

    it('should display title as first line', () => {
      sut.display();

      expect(consoleLogSpy.mock.calls[0][0]).toBe('Nooa Core Engine - Architectural Grammar Validator');
    });

    it('should display requirement about grammar file as last line', () => {
      sut.display();

      const lastCall = consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0];
      expect(lastCall).toBe('The project must contain a nooa.grammar.yaml file at its root.');
    });
  });
});

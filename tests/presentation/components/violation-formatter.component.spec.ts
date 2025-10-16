import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ViolationFormatterComponent } from '../../../src/presentation/components/violation-formatter.component';
import { ArchitecturalViolationModel } from '../../../src/domain/models';

describe('ViolationFormatterComponent', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let sut: ViolationFormatterComponent;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    sut = new ViolationFormatterComponent();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('display', () => {
    it('should display violation with all fields', () => {
      const violation: ArchitecturalViolationModel = {
        ruleName: 'No-Forbidden-Dependencies',
        severity: 'error',
        file: 'src/domain/user.ts',
        message: 'Domain should not depend on Infrastructure',
        fromRole: 'DOMAIN',
        toRole: 'INFRA',
        dependency: 'src/infra/database/connection.ts',
      };

      sut.display(violation, 1);

      expect(consoleLogSpy).toHaveBeenCalledWith('  1. [No-Forbidden-Dependencies]');
      expect(consoleLogSpy).toHaveBeenCalledWith('     File: src/domain/user.ts');
      expect(consoleLogSpy).toHaveBeenCalledWith('     DOMAIN → INFRA');
      expect(consoleLogSpy).toHaveBeenCalledWith('     Dependency: src/infra/database/connection.ts');
      expect(consoleLogSpy).toHaveBeenCalledWith('     Domain should not depend on Infrastructure');
      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });

    it('should not display roles when fromRole or toRole is undefined', () => {
      const violation: ArchitecturalViolationModel = {
        ruleName: 'File-Size-Warning',
        severity: 'warning',
        file: 'src/utils/helper.ts',
        message: 'File exceeds 100 lines',
        fromRole: undefined,
        toRole: undefined,
        dependency: undefined,
      };

      sut.display(violation, 2);

      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('→'));
    });

    it('should not display dependency when dependency is undefined', () => {
      const violation: ArchitecturalViolationModel = {
        ruleName: 'File-Size-Warning',
        severity: 'warning',
        file: 'src/utils/helper.ts',
        message: 'File exceeds 100 lines',
        fromRole: undefined,
        toRole: undefined,
        dependency: undefined,
      };

      sut.display(violation, 2);

      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Dependency:'));
    });

    it('should display correct index number', () => {
      const violation: ArchitecturalViolationModel = {
        ruleName: 'Test-Rule',
        severity: 'info',
        file: 'src/test.ts',
        message: 'Test message',
        fromRole: undefined,
        toRole: undefined,
        dependency: undefined,
      };

      sut.display(violation, 42);

      expect(consoleLogSpy).toHaveBeenCalledWith('  42. [Test-Rule]');
    });

    it('should display violation with fromRole and toRole but no dependency', () => {
      const violation: ArchitecturalViolationModel = {
        ruleName: 'Controllers-Need-Factories',
        severity: 'error',
        file: 'src/main/factories/controller.factory.ts',
        message: 'Controller factory does not import use case factories',
        fromRole: 'COMPOSER_CONTROLLER_FACTORY',
        toRole: 'COMPOSER',
        dependency: undefined,
      };

      sut.display(violation, 5);

      expect(consoleLogSpy).toHaveBeenCalledWith('     COMPOSER_CONTROLLER_FACTORY → COMPOSER');
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Dependency:'));
    });

    it('should always end with empty line', () => {
      const violation: ArchitecturalViolationModel = {
        ruleName: 'Test-Rule',
        severity: 'info',
        file: 'src/test.ts',
        message: 'Test message',
        fromRole: undefined,
        toRole: undefined,
        dependency: undefined,
      };

      sut.display(violation, 1);

      const lastCall = consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0];
      expect(lastCall).toBe('');
    });
  });
});

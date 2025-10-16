import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CliViolationPresenter } from '../../../src/presentation/presenters/cli-violation.presenter';
import { IDisplayConfigProvider } from '../../../src/presentation/protocols/display-config-provider';
import { ArchitecturalViolationModel } from '../../../src/domain/models';
import {
  UsageComponent,
  ViolationFormatterComponent,
  MetricsFormatterComponent,
  ErrorFormatterComponent,
  SummaryFormatterComponent,
} from '../../../src/presentation/components';

// Mock all components
vi.mock('../../../src/presentation/components', () => ({
  UsageComponent: vi.fn(),
  ViolationFormatterComponent: vi.fn(),
  MetricsFormatterComponent: vi.fn(),
  ErrorFormatterComponent: vi.fn(),
  SummaryFormatterComponent: vi.fn(),
}));

describe('CliViolationPresenter', () => {
  let displayConfig: IDisplayConfigProvider;
  let usageComponentMock: { display: ReturnType<typeof vi.fn> };
  let violationFormatterMock: { display: ReturnType<typeof vi.fn> };
  let metricsFormatterMock: { display: ReturnType<typeof vi.fn> };
  let errorFormatterMock: { display: ReturnType<typeof vi.fn> };
  let summaryFormatterMock: { display: ReturnType<typeof vi.fn> };
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    displayConfig = {
      isDebugMode: () => false,
    };

    usageComponentMock = { display: vi.fn() };
    violationFormatterMock = { display: vi.fn() };
    metricsFormatterMock = { display: vi.fn() };
    errorFormatterMock = { display: vi.fn() };
    summaryFormatterMock = { display: vi.fn() };

    (UsageComponent as any).mockImplementation(() => usageComponentMock);
    (ViolationFormatterComponent as any).mockImplementation(() => violationFormatterMock);
    (MetricsFormatterComponent as any).mockImplementation(() => metricsFormatterMock);
    (ErrorFormatterComponent as any).mockImplementation(() => errorFormatterMock);
    (SummaryFormatterComponent as any).mockImplementation(() => summaryFormatterMock);

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create instance with all components', () => {
      const sut = new CliViolationPresenter(displayConfig);

      expect(sut).toBeInstanceOf(CliViolationPresenter);
      expect(UsageComponent).toHaveBeenCalled();
      expect(ViolationFormatterComponent).toHaveBeenCalled();
      expect(MetricsFormatterComponent).toHaveBeenCalled();
      expect(ErrorFormatterComponent).toHaveBeenCalledWith(displayConfig);
      expect(SummaryFormatterComponent).toHaveBeenCalledWith(violationFormatterMock);
    });

    it('should pass displayConfig to ErrorFormatterComponent', () => {
      new CliViolationPresenter(displayConfig);

      expect(ErrorFormatterComponent).toHaveBeenCalledWith(displayConfig);
    });

    it('should pass ViolationFormatterComponent to SummaryFormatterComponent', () => {
      new CliViolationPresenter(displayConfig);

      expect(SummaryFormatterComponent).toHaveBeenCalledWith(violationFormatterMock);
    });
  });

  describe('displayUsage', () => {
    it('should delegate to usageComponent.display', () => {
      const sut = new CliViolationPresenter(displayConfig);

      sut.displayUsage();

      expect(usageComponentMock.display).toHaveBeenCalledOnce();
    });
  });

  describe('displayResults', () => {
    it('should display success message when no violations', () => {
      const sut = new CliViolationPresenter(displayConfig);

      sut.displayResults([], 500);

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ No architectural violations found!');
      expect(consoleLogSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).toHaveBeenCalledWith('Your codebase perfectly follows the defined architectural rules.');
    });

    it('should call displayMetrics when no violations', () => {
      const sut = new CliViolationPresenter(displayConfig);

      sut.displayResults([], 500);

      expect(metricsFormatterMock.display).toHaveBeenCalledWith([], 500);
    });

    it('should display violations count when violations exist', () => {
      const sut = new CliViolationPresenter(displayConfig);
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
        {
          ruleName: 'Test-Rule-2',
          severity: 'warning',
          file: 'file2.ts',
          message: 'Test',
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        },
      ];

      sut.displayResults(violations, 500);

      expect(consoleLogSpy).toHaveBeenCalledWith('❌ Found 2 architectural violation(s):');
    });

    it('should delegate to summaryFormatter when violations exist', () => {
      const sut = new CliViolationPresenter(displayConfig);
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

      sut.displayResults(violations, 500);

      expect(summaryFormatterMock.display).toHaveBeenCalledWith(violations);
    });

    it('should call displayMetrics when violations exist', () => {
      const sut = new CliViolationPresenter(displayConfig);
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

      sut.displayResults(violations, 500);

      expect(metricsFormatterMock.display).toHaveBeenCalledWith(violations, 500);
    });

    it('should not call summaryFormatter when no violations', () => {
      const sut = new CliViolationPresenter(displayConfig);

      sut.displayResults([], 500);

      expect(summaryFormatterMock.display).not.toHaveBeenCalled();
    });
  });

  describe('displayMetrics', () => {
    it('should delegate to metricsFormatter.display', () => {
      const sut = new CliViolationPresenter(displayConfig);
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

      sut.displayMetrics(violations, 1234);

      expect(metricsFormatterMock.display).toHaveBeenCalledWith(violations, 1234);
    });

    it('should work with empty violations array', () => {
      const sut = new CliViolationPresenter(displayConfig);

      sut.displayMetrics([], 100);

      expect(metricsFormatterMock.display).toHaveBeenCalledWith([], 100);
    });
  });

  describe('displayViolation', () => {
    it('should delegate to violationFormatter.display', () => {
      const sut = new CliViolationPresenter(displayConfig);
      const violation: ArchitecturalViolationModel = {
        ruleName: 'Test-Rule',
        severity: 'error',
        file: 'file1.ts',
        message: 'Test message',
        fromRole: undefined,
        toRole: undefined,
        dependency: undefined,
      };

      sut.displayViolation(violation, 5);

      expect(violationFormatterMock.display).toHaveBeenCalledWith(violation, 5);
    });

    it('should pass correct index to violationFormatter', () => {
      const sut = new CliViolationPresenter(displayConfig);
      const violation: ArchitecturalViolationModel = {
        ruleName: 'Test-Rule',
        severity: 'error',
        file: 'file1.ts',
        message: 'Test',
        fromRole: undefined,
        toRole: undefined,
        dependency: undefined,
      };

      sut.displayViolation(violation, 42);

      expect(violationFormatterMock.display).toHaveBeenCalledWith(violation, 42);
    });
  });

  describe('displayError', () => {
    it('should delegate to errorFormatter.display with Error instance', () => {
      const sut = new CliViolationPresenter(displayConfig);
      const error = new Error('Test error');

      sut.displayError(error);

      expect(errorFormatterMock.display).toHaveBeenCalledWith(error);
    });

    it('should delegate to errorFormatter.display with unknown error type', () => {
      const sut = new CliViolationPresenter(displayConfig);
      const error = 'string error';

      sut.displayError(error);

      expect(errorFormatterMock.display).toHaveBeenCalledWith(error);
    });

    it('should handle null error', () => {
      const sut = new CliViolationPresenter(displayConfig);

      sut.displayError(null);

      expect(errorFormatterMock.display).toHaveBeenCalledWith(null);
    });

    it('should handle undefined error', () => {
      const sut = new CliViolationPresenter(displayConfig);

      sut.displayError(undefined);

      expect(errorFormatterMock.display).toHaveBeenCalledWith(undefined);
    });
  });
});

/**
 * Unit tests for FileMetricsValidator (Coordinator)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileMetricsValidator } from '../../../src/data/validators/file-metrics.validator';
import { CodeSymbolModel } from '../../../src/domain/models';
import * as FileSizeValidatorModule from '../../../src/data/validators/metrics/file-size.validator';
import * as TestCoverageValidatorModule from '../../../src/data/validators/metrics/test-coverage.validator';
import * as DocumentationValidatorModule from '../../../src/data/validators/metrics/documentation.validator';
import * as ClassComplexityValidatorModule from '../../../src/data/validators/metrics/class-complexity.validator';
import * as GranularityMetricValidatorModule from '../../../src/data/validators/metrics/granularity-metric.validator';

vi.mock('../../../src/data/validators/metrics/file-size.validator');
vi.mock('../../../src/data/validators/metrics/test-coverage.validator');
vi.mock('../../../src/data/validators/metrics/documentation.validator');
vi.mock('../../../src/data/validators/metrics/class-complexity.validator');
vi.mock('../../../src/data/validators/metrics/granularity-metric.validator');

describe('FileMetricsValidator', () => {
  const projectPath = '/project';
  const symbols: CodeSymbolModel[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should coordinate all metric validators in parallel', async () => {
    const fileSizeViolation = { ruleName: 'file-size', file: 'test.ts' } as any;
    const docViolation = { ruleName: 'doc', file: 'test2.ts' } as any;

    const mockFileSizeValidate = vi.fn().mockResolvedValue([fileSizeViolation]);
    const mockTestCoverageValidate = vi.fn().mockResolvedValue([]);
    const mockDocValidate = vi.fn().mockResolvedValue([docViolation]);
    const mockClassComplexityValidate = vi.fn().mockResolvedValue([]);
    const mockGranularityValidate = vi.fn().mockResolvedValue([]);

    vi.mocked(FileSizeValidatorModule.FileSizeValidator).mockImplementation(() => ({
      validate: mockFileSizeValidate,
    } as any));

    vi.mocked(TestCoverageValidatorModule.TestCoverageValidator).mockImplementation(() => ({
      validate: mockTestCoverageValidate,
    } as any));

    vi.mocked(DocumentationValidatorModule.DocumentationValidator).mockImplementation(() => ({
      validate: mockDocValidate,
    } as any));

    vi.mocked(ClassComplexityValidatorModule.ClassComplexityValidator).mockImplementation(() => ({
      validate: mockClassComplexityValidate,
    } as any));

    vi.mocked(GranularityMetricValidatorModule.GranularityMetricValidator).mockImplementation(() => ({
      validate: mockGranularityValidate,
    } as any));

    // Pass at least one rule to each validator to ensure they are created
    const fileSizeRule = { name: 'test', severity: 'error', rule: 'file_size', for: { role: 'TEST' }, max_lines: 100 } as any;
    const docRule = { name: 'test', severity: 'error', rule: 'documentation_required', for: { role: 'TEST' }, min_lines: 50, requires_jsdoc: true } as any;

    const sut = new FileMetricsValidator([fileSizeRule], [], [docRule], [], []);
    const result = await sut.validate(symbols, projectPath);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(fileSizeViolation);
    expect(result).toContainEqual(docViolation);
    expect(mockFileSizeValidate).toHaveBeenCalledWith(symbols, projectPath, undefined);
    expect(mockDocValidate).toHaveBeenCalledWith(symbols, projectPath, undefined);
    // Test coverage, class complexity, and granularity should not be called since no rules
    expect(mockTestCoverageValidate).not.toHaveBeenCalled();
    expect(mockClassComplexityValidate).not.toHaveBeenCalled();
    expect(mockGranularityValidate).not.toHaveBeenCalled();
  });

  it('should pass file cache to validators that support it', async () => {
    const fileCache = new Map<string, string>();
    const mockFileSizeValidate = vi.fn().mockResolvedValue([]);
    const mockTestCoverageValidate = vi.fn().mockResolvedValue([]);
    const mockDocValidate = vi.fn().mockResolvedValue([]);
    const mockClassComplexityValidate = vi.fn().mockResolvedValue([]);
    const mockGranularityValidate = vi.fn().mockResolvedValue([]);

    vi.mocked(FileSizeValidatorModule.FileSizeValidator).mockImplementation(() => ({
      validate: mockFileSizeValidate,
    } as any));

    vi.mocked(TestCoverageValidatorModule.TestCoverageValidator).mockImplementation(() => ({
      validate: mockTestCoverageValidate,
    } as any));

    vi.mocked(DocumentationValidatorModule.DocumentationValidator).mockImplementation(() => ({
      validate: mockDocValidate,
    } as any));

    vi.mocked(ClassComplexityValidatorModule.ClassComplexityValidator).mockImplementation(() => ({
      validate: mockClassComplexityValidate,
    } as any));

    vi.mocked(GranularityMetricValidatorModule.GranularityMetricValidator).mockImplementation(() => ({
      validate: mockGranularityValidate,
    } as any));

    // Pass rules to create validators
    const fileSizeRule = { name: 'test', severity: 'error', rule: 'file_size', for: { role: 'TEST' }, max_lines: 100 } as any;
    const docRule = { name: 'test', severity: 'error', rule: 'documentation_required', for: { role: 'TEST' }, min_lines: 50, requires_jsdoc: true } as any;
    const granularityRule = { name: 'test', severity: 'error', rule: 'granularity_metric', global: { target_loc_per_file: 20, warning_threshold_multiplier: 1.5 } } as any;

    const sut = new FileMetricsValidator([fileSizeRule], [], [docRule], [], [granularityRule]);
    await sut.validate(symbols, projectPath, fileCache);

    expect(mockFileSizeValidate).toHaveBeenCalledWith(symbols, projectPath, fileCache);
    expect(mockDocValidate).toHaveBeenCalledWith(symbols, projectPath, fileCache);
    expect(mockGranularityValidate).toHaveBeenCalledWith(symbols, projectPath, fileCache);
  });

  it('should flatten all violations from all validators', async () => {
    const violations1 = [{ ruleName: 'rule1' }, { ruleName: 'rule2' }] as any;
    const violations2 = [{ ruleName: 'rule3' }] as any;
    const violations3 = [{ ruleName: 'rule4' }, { ruleName: 'rule5' }] as any;

    vi.mocked(FileSizeValidatorModule.FileSizeValidator).mockImplementation(() => ({
      validate: vi.fn().mockResolvedValue(violations1),
    } as any));

    vi.mocked(TestCoverageValidatorModule.TestCoverageValidator).mockImplementation(() => ({
      validate: vi.fn().mockResolvedValue(violations2),
    } as any));

    vi.mocked(DocumentationValidatorModule.DocumentationValidator).mockImplementation(() => ({
      validate: vi.fn().mockResolvedValue(violations3),
    } as any));

    vi.mocked(ClassComplexityValidatorModule.ClassComplexityValidator).mockImplementation(() => ({
      validate: vi.fn().mockResolvedValue([]),
    } as any));

    vi.mocked(GranularityMetricValidatorModule.GranularityMetricValidator).mockImplementation(() => ({
      validate: vi.fn().mockResolvedValue([]),
    } as any));

    // Pass rules to create validators
    const fileSizeRule = { name: 'test', severity: 'error', rule: 'file_size', for: { role: 'TEST' }, max_lines: 100 } as any;
    const testCoverageRule = { name: 'test', severity: 'error', rule: 'test_coverage', from: { role: 'TEST' }, to: { test_file: 'required' } } as any;
    const docRule = { name: 'test', severity: 'error', rule: 'documentation_required', for: { role: 'TEST' }, min_lines: 50, requires_jsdoc: true } as any;

    const sut = new FileMetricsValidator([fileSizeRule], [testCoverageRule], [docRule], [], []);
    const result = await sut.validate(symbols, projectPath);

    expect(result).toHaveLength(5);
    expect(result.map(v => v.ruleName)).toEqual(['rule1', 'rule2', 'rule3', 'rule4', 'rule5']);
  });

  it('should return empty array when no violations found', async () => {
    vi.mocked(FileSizeValidatorModule.FileSizeValidator).mockImplementation(() => ({
      validate: vi.fn().mockResolvedValue([]),
    } as any));

    vi.mocked(TestCoverageValidatorModule.TestCoverageValidator).mockImplementation(() => ({
      validate: vi.fn().mockResolvedValue([]),
    } as any));

    vi.mocked(DocumentationValidatorModule.DocumentationValidator).mockImplementation(() => ({
      validate: vi.fn().mockResolvedValue([]),
    } as any));

    vi.mocked(ClassComplexityValidatorModule.ClassComplexityValidator).mockImplementation(() => ({
      validate: vi.fn().mockResolvedValue([]),
    } as any));

    vi.mocked(GranularityMetricValidatorModule.GranularityMetricValidator).mockImplementation(() => ({
      validate: vi.fn().mockResolvedValue([]),
    } as any));

    const sut = new FileMetricsValidator([], [], [], [], []);
    const result = await sut.validate(symbols, projectPath);

    expect(result).toEqual([]);
  });
});

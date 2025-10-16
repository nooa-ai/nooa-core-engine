import { ArchitecturalViolationModel } from '../models/architectural-violation.model';
import { RuleSeverity } from '../models/architectural-rule.model';

const baseViolation: ArchitecturalViolationModel = {
  ruleName: 'SAMPLE_RULE',
  severity: 'warning',
  file: 'src/sample/service.ts',
  message: 'Sample violation message.',
  fromRole: 'SERVICE',
  toRole: 'REPOSITORY',
  dependency: 'src/repository/user-repository.ts',
};

export const makeArchitecturalViolationMock = (
  overrides: Partial<ArchitecturalViolationModel> = {},
): ArchitecturalViolationModel => ({
  ...baseViolation,
  ...overrides,
  severity: (overrides.severity ?? baseViolation.severity) as RuleSeverity,
});

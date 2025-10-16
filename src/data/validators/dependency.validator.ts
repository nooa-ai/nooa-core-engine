/**
 * Dependency Validator (Coordinator)
 *
 * Coordinates dependency validation by delegating to specialized validators:
 * - ForbiddenDependencyChecker: Validates forbidden dependencies
 * - RequiredDependencyValidator: Validates required dependencies
 * - CircularDependencyDetector: Detects circular dependencies
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  DependencyRule,
} from '../../domain/models';
import { BaseRuleValidator } from './base-rule.validator';
import {
  ForbiddenDependencyChecker,
  RequiredDependencyValidator,
  CircularDependencyDetector,
} from './dependencies';

export class DependencyValidator extends BaseRuleValidator {
  private readonly forbiddenChecker: ForbiddenDependencyChecker;
  private readonly requiredValidator: RequiredDependencyValidator;
  private readonly circularDetector: CircularDependencyDetector;

  constructor(private readonly rules: DependencyRule[]) {
    super();
    this.forbiddenChecker = new ForbiddenDependencyChecker(rules);
    this.requiredValidator = new RequiredDependencyValidator(rules);
    this.circularDetector = new CircularDependencyDetector(rules);
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    // Delegate to specialized validators and aggregate results
    const [forbiddenViolations, requiredViolations, circularViolations] = await Promise.all([
      this.forbiddenChecker.validate(symbols, projectPath),
      this.requiredValidator.validate(symbols, projectPath),
      this.circularDetector.validate(symbols, projectPath),
    ]);

    return [...forbiddenViolations, ...requiredViolations, ...circularViolations];
  }
}

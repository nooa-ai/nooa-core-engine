/**
 * Base Rule Validator
 *
 * Abstract base class for all rule validators.
 * Provides common functionality and enforces validator interface.
 */
import { ArchitecturalViolationModel, CodeSymbolModel } from '../../domain/models';
import { RoleMatcherHelper } from '../helpers';

export abstract class BaseRuleValidator {
  protected roleMatcher: RoleMatcherHelper;

  constructor() {
    this.roleMatcher = new RoleMatcherHelper();
  }

  /**
   * Validates rules and returns violations
   * @param symbols - Code symbols to validate
   * @param projectPath - Project path for file system operations
   * @returns Promise resolving to array of violations
   */
  abstract validate(
    symbols: CodeSymbolModel[],
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]>;
}

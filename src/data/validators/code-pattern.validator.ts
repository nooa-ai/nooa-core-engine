/**
 * Code Pattern Validator
 *
 * Validates code patterns including:
 * - Forbidden keywords
 * - Forbidden regex patterns
 * - Barrel purity (index files should only re-export)
 *
 * Refactored in v1.4.1 to extract pattern checking logic to PatternCheckerHelper.
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  ForbiddenKeywordsRule,
  ForbiddenPatternsRule,
  BarrelPurityRule,
} from '../../domain/models';
import { BaseRuleValidator } from './base-rule.validator';
import { readFileContent } from '../helpers';
import { PatternCheckerHelper } from './patterns/pattern-checker.helper';

export class CodePatternValidator extends BaseRuleValidator {
  private readonly patternChecker: PatternCheckerHelper;

  constructor(
    private readonly forbiddenKeywordsRules: ForbiddenKeywordsRule[],
    private readonly forbiddenPatternsRules: ForbiddenPatternsRule[],
    private readonly barrelPurityRules: BarrelPurityRule[]
  ) {
    super();
    this.patternChecker = new PatternCheckerHelper();
  }

  async validate(
    symbols: CodeSymbolModel[],
    _projectPath: string,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    // Run all rule validations in parallel (performance optimization)
    const validationPromises: Promise<ArchitecturalViolationModel[]>[] = [];

    // Validate forbidden keywords
    for (const rule of this.forbiddenKeywordsRules) {
      validationPromises.push(this.validateForbiddenKeywords(symbols, rule, fileCache));
    }

    // Validate forbidden patterns
    for (const rule of this.forbiddenPatternsRules) {
      validationPromises.push(this.validateForbiddenPatterns(symbols, rule, fileCache));
    }

    // Validate barrel purity
    for (const rule of this.barrelPurityRules) {
      validationPromises.push(this.validateBarrelPurity(symbols, rule, fileCache));
    }

    const results = await Promise.all(validationPromises);
    return results.flat();
  }

  private async validateForbiddenKeywords(
    symbols: CodeSymbolModel[],
    rule: ForbiddenKeywordsRule,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    return this.validateContent(
      symbols,
      rule,
      fileCache,
      (symbol) => this.roleMatcher.matches(symbol.role, rule.from.role),
      (content) => this.patternChecker.findForbiddenKeyword(content, rule.contains_forbidden),
      (match) => `contains forbidden keyword '${match}'`
    );
  }

  private async validateForbiddenPatterns(
    symbols: CodeSymbolModel[],
    rule: ForbiddenPatternsRule,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    return this.validateContent(
      symbols,
      rule,
      fileCache,
      (symbol) => this.roleMatcher.matches(symbol.role, rule.from.role),
      (content) => this.patternChecker.findForbiddenPattern(content, rule.contains_forbidden),
      (match) => `contains forbidden pattern '${match}'`
    );
  }

  private async validateBarrelPurity(
    symbols: CodeSymbolModel[],
    rule: BarrelPurityRule,
    fileCache?: Map<string, string>
  ): Promise<ArchitecturalViolationModel[]> {
    const filePattern = new RegExp(rule.for.file_pattern);
    return this.validateContent(
      symbols,
      rule,
      fileCache,
      (symbol) => filePattern.test(symbol.path),
      (content) => this.patternChecker.findForbiddenPattern(content, rule.contains_forbidden),
      (match) => `Barrel file contains forbidden pattern '${match}' - should only re-export`
    );
  }

  /**
   * Generic content validation method to reduce duplication
   */
  private async validateContent(
    symbols: CodeSymbolModel[],
    rule: ForbiddenKeywordsRule | ForbiddenPatternsRule | BarrelPurityRule,
    fileCache: Map<string, string> | undefined,
    filterFn: (symbol: CodeSymbolModel) => boolean,
    checkFn: (content: string) => string | null,
    messageFn: (match: string) => string
  ): Promise<ArchitecturalViolationModel[]> {
    const symbolsToCheck = symbols.filter(filterFn);

    const validationPromises = symbolsToCheck.map(async (symbol) => {
      const content = readFileContent(symbol.path, fileCache);
      if (!content) return null;

      const match = checkFn(content);
      if (match) {
        return this.createViolation(rule, symbol, messageFn(match));
      }
      return null;
    });

    const results = await Promise.all(validationPromises);
    return results.filter((v) => v !== null) as ArchitecturalViolationModel[];
  }

  /**
   * Creates a violation object with consistent structure
   */
  private createViolation(
    rule: ForbiddenKeywordsRule | ForbiddenPatternsRule | BarrelPurityRule,
    symbol: CodeSymbolModel,
    reason: string
  ): ArchitecturalViolationModel {
    return {
      ruleName: rule.name,
      severity: rule.severity,
      file: symbol.path,
      message: `${rule.name}: ${symbol.path} ${reason}${rule.comment ? ` - ${rule.comment}` : ''}`,
      fromRole: symbol.role,
      toRole: undefined,
      dependency: undefined,
    };
  }
}

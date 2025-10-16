/**
 * Hygiene Validator
 *
 * Validates code hygiene including:
 * - Synonym detection (similar names)
 * - Unreferenced code detection (zombie files)
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  SynonymDetectionRule,
  UnreferencedCodeRule,
} from '../../domain/models';
import { BaseRuleValidator } from './base-rule.validator';
import { StringSimilarityHelper } from '../helpers';

export class HygieneValidator extends BaseRuleValidator {
  private similarityHelper: StringSimilarityHelper;

  constructor(
    private readonly synonymRules: SynonymDetectionRule[],
    private readonly unreferencedRules: UnreferencedCodeRule[]
  ) {
    super();
    this.similarityHelper = new StringSimilarityHelper();
  }

  async validate(symbols: CodeSymbolModel[], _projectPath: string): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    // Validate synonyms
    for (const rule of this.synonymRules) {
      violations.push(...this.validateSynonyms(symbols, rule));
    }

    // Validate unreferenced code
    for (const rule of this.unreferencedRules) {
      violations.push(...this.detectUnreferencedCode(symbols, rule));
    }

    return violations;
  }

  /**
   * Validates that symbols don't have very similar names (potential duplicates)
   */
  private validateSynonyms(
    symbols: CodeSymbolModel[],
    rule: SynonymDetectionRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.for.role)
    );

    for (let i = 0; i < symbolsToCheck.length; i++) {
      for (let j = i + 1; j < symbolsToCheck.length; j++) {
        const symbol1 = symbolsToCheck[i];
        const symbol2 = symbolsToCheck[j];

        const name1 = this.similarityHelper.extractFileName(symbol1.path);
        const name2 = this.similarityHelper.extractFileName(symbol2.path);

        const normalized1 = this.similarityHelper.normalizeName(name1, rule.options.thesaurus);
        const normalized2 = this.similarityHelper.normalizeName(name2, rule.options.thesaurus);

        const similarity = this.similarityHelper.calculateSimilarity(normalized1, normalized2);

        if (similarity >= rule.options.similarity_threshold) {
          violations.push({
            ruleName: rule.name,
            severity: rule.severity,
            file: symbol1.path,
            message: `${rule.name}: Files "${symbol1.path}" and "${symbol2.path}" have very similar names (${(similarity * 100).toFixed(0)}% similar). Consider consolidating them to avoid code duplication${rule.comment ? ` - ${rule.comment}` : ''}`,
            fromRole: symbol1.role,
            toRole: symbol2.role,
            dependency: symbol2.path,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Detects unreferenced code (zombie files)
   */
  private detectUnreferencedCode(
    symbols: CodeSymbolModel[],
    rule: UnreferencedCodeRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    // Build reverse dependency map
    const incomingReferences = new Map<string, number>();
    symbols.forEach((symbol) => incomingReferences.set(symbol.path, 0));

    symbols.forEach((symbol) => {
      symbol.dependencies.forEach((depPath) => {
        const current = incomingReferences.get(depPath) || 0;
        incomingReferences.set(depPath, current + 1);
      });
    });

    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.for.role)
    );

    for (const symbol of symbolsToCheck) {
      const refCount = incomingReferences.get(symbol.path) || 0;

      if (refCount > 0) {
        continue;
      }

      // Check if file matches ignore patterns
      if (rule.options?.ignore_patterns) {
        const shouldIgnore = rule.options.ignore_patterns.some((pattern) => {
          const regex = new RegExp(pattern);
          return regex.test(symbol.path);
        });

        if (shouldIgnore) {
          continue;
        }
      }

      violations.push({
        ruleName: rule.name,
        severity: rule.severity,
        file: symbol.path,
        message: `${rule.name}: File "${symbol.path}" (${symbol.role}) is not imported by any other file. It may be dead code that can be removed${rule.comment ? ` - ${rule.comment}` : ''}`,
        fromRole: symbol.role,
        toRole: undefined,
        dependency: undefined,
      });
    }

    return violations;
  }
}

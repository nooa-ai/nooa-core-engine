/**
 * Use Case Implementation: Analyze Codebase
 *
 * This class implements the business logic for architectural validation.
 * It orchestrates the parsing of code, loading of grammar, and violation detection.
 *
 * Following Clean Architecture principles:
 * - Implements the IAnalyzeCodebase interface from Domain
 * - Depends on abstractions (protocols) not concretions
 * - Contains the core application logic
 * - Has no knowledge of infrastructure details (databases, file systems, etc.)
 */

import { IAnalyzeCodebase } from '../../domain/usecases';
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  GrammarModel,
  ArchitecturalRuleModel,
  DependencyRule,
  NamingPatternRule,
  SynonymDetectionRule,
  UnreferencedCodeRule,
  RoleReference,
  FileSizeRule,
  TestCoverageRule,
  ForbiddenKeywordsRule,
  RequiredStructureRule,
  DocumentationRequiredRule,
  ClassComplexityRule,
  MinimumTestRatioRule,
  GranularityMetricRule,
} from '../../domain/models';
import { ICodeParser, IGrammarRepository } from '../protocols';

/**
 * Implementation of the Analyze Codebase use case
 */
export class AnalyzeCodebaseUseCase implements IAnalyzeCodebase {
  /**
   * Constructor with dependency injection
   * All dependencies are abstractions (interfaces), enabling testability and flexibility
   *
   * @param codeParser - Protocol for parsing source code
   * @param grammarRepository - Protocol for loading grammar configuration
   */
  constructor(
    private readonly codeParser: ICodeParser,
    private readonly grammarRepository: IGrammarRepository
  ) {}

  /**
   * Analyzes a codebase for architectural violations
   *
   * Algorithm:
   * 1. Load the grammar configuration
   * 2. Parse the codebase to extract symbols
   * 3. Assign roles to symbols based on path patterns
   * 4. Validate dependencies against architectural rules
   * 5. Return all violations found
   */
  async analyze(params: IAnalyzeCodebase.Params): Promise<IAnalyzeCodebase.Result> {
    const { projectPath } = params;

    // Step 1: Load grammar configuration
    const grammar = await this.grammarRepository.load(projectPath);

    // Step 2: Parse codebase
    const symbols = await this.codeParser.parse(projectPath);

    // Step 3: Assign roles to symbols
    const symbolsWithRoles = this.assignRolesToSymbols(symbols, grammar);

    // Step 4: Validate dependencies and collect violations
    const violations = await this.validateArchitecture(symbolsWithRoles, grammar, projectPath);

    return violations;
  }

  /**
   * Assigns architectural roles to code symbols based on path patterns
   *
   * @param symbols - Code symbols extracted from the codebase
   * @param grammar - Grammar configuration with role definitions
   * @returns Symbols with assigned roles
   */
  private assignRolesToSymbols(
    symbols: CodeSymbolModel[],
    grammar: GrammarModel
  ): CodeSymbolModel[] {
    return symbols.map((symbol) => {
      // Find the first role whose path pattern matches the symbol's path
      const matchingRole = grammar.roles.find((role) => {
        const pattern = new RegExp(role.path);
        return pattern.test(symbol.path);
      });

      return {
        ...symbol,
        role: matchingRole?.name || 'UNKNOWN',
      };
    });
  }

  /**
   * Validates architectural dependencies and detects violations
   *
   * @param symbols - Code symbols with assigned roles
   * @param grammar - Grammar configuration with rules
   * @param projectPath - Project path for file system operations
   * @returns Array of architectural violations
   */
  private async validateArchitecture(
    symbols: CodeSymbolModel[],
    grammar: GrammarModel,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    // Create a map for quick symbol lookup by path
    const symbolMap = new Map<string, CodeSymbolModel>();
    symbols.forEach((symbol) => {
      symbolMap.set(symbol.path, symbol);
    });

    // Check for circular dependency rules first
    const circularRules = grammar.rules.filter(
      (rule): rule is DependencyRule =>
        rule.rule !== 'naming_pattern' &&
        rule.rule !== 'find_synonyms' &&
        rule.rule !== 'detect_unreferenced' &&
        rule.rule !== 'file_size' &&
        rule.rule !== 'test_coverage' &&
        rule.rule !== 'forbidden_keywords' &&
        rule.rule !== 'required_structure' &&
        rule.rule !== 'documentation_required' &&
        rule.rule !== 'class_complexity' &&
        rule.rule !== 'minimum_test_ratio' &&
        rule.rule !== 'granularity_metric' &&
        'to' in rule &&
        rule.to &&
        'circular' in rule.to &&
        rule.to.circular === true
    );
    if (circularRules.length > 0) {
      for (const rule of circularRules) {
        const circularViolations = this.detectCircularDependencies(symbols, symbolMap, rule);
        violations.push(...circularViolations);
      }
    }

    // Check for required dependency rules
    const requiredRules = grammar.rules.filter(
      (rule): rule is DependencyRule => rule.rule === 'required'
    );
    if (requiredRules.length > 0) {
      for (const rule of requiredRules) {
        const requiredViolations = this.validateRequiredDependencies(symbols, symbolMap, rule);
        violations.push(...requiredViolations);
      }
    }

    // Check for naming pattern rules
    const namingPatternRules = grammar.rules.filter(
      (rule): rule is NamingPatternRule => rule.rule === 'naming_pattern'
    );
    if (namingPatternRules.length > 0) {
      for (const rule of namingPatternRules) {
        const namingViolations = this.validateNamingPatterns(symbols, rule);
        violations.push(...namingViolations);
      }
    }

    // Check for synonym detection rules (hygiene)
    const synonymRules = grammar.rules.filter(
      (rule): rule is SynonymDetectionRule => rule.rule === 'find_synonyms'
    );
    if (synonymRules.length > 0) {
      for (const rule of synonymRules) {
        const synonymViolations = this.validateSynonyms(symbols, rule);
        violations.push(...synonymViolations);
      }
    }

    // Check for unreferenced code rules (hygiene)
    const unreferencedRules = grammar.rules.filter(
      (rule): rule is UnreferencedCodeRule => rule.rule === 'detect_unreferenced'
    );
    if (unreferencedRules.length > 0) {
      for (const rule of unreferencedRules) {
        const unreferencedViolations = this.detectUnreferencedCode(symbols, rule);
        violations.push(...unreferencedViolations);
      }
    }

    // Check for file size rules
    const fileSizeRules = grammar.rules.filter(
      (rule): rule is FileSizeRule => rule.rule === 'file_size'
    );
    if (fileSizeRules.length > 0) {
      for (const rule of fileSizeRules) {
        const fileSizeViolations = await this.validateFileSize(symbols, rule, projectPath);
        violations.push(...fileSizeViolations);
      }
    }

    // Check for test coverage rules
    const testCoverageRules = grammar.rules.filter(
      (rule): rule is TestCoverageRule => rule.rule === 'test_coverage'
    );
    if (testCoverageRules.length > 0) {
      for (const rule of testCoverageRules) {
        const testCoverageViolations = await this.validateTestCoverage(symbols, rule, projectPath);
        violations.push(...testCoverageViolations);
      }
    }

    // Check for forbidden keywords rules
    const forbiddenKeywordsRules = grammar.rules.filter(
      (rule): rule is ForbiddenKeywordsRule => rule.rule === 'forbidden_keywords'
    );
    if (forbiddenKeywordsRules.length > 0) {
      for (const rule of forbiddenKeywordsRules) {
        const forbiddenViolations = await this.validateForbiddenKeywords(symbols, rule, projectPath);
        violations.push(...forbiddenViolations);
      }
    }

    // Check for required structure rules
    const requiredStructureRules = grammar.rules.filter(
      (rule): rule is RequiredStructureRule => rule.rule === 'required_structure'
    );
    if (requiredStructureRules.length > 0) {
      for (const rule of requiredStructureRules) {
        const structureViolations = await this.validateRequiredStructure(rule, projectPath);
        violations.push(...structureViolations);
      }
    }

    // Check for documentation required rules
    const documentationRules = grammar.rules.filter(
      (rule): rule is DocumentationRequiredRule => rule.rule === 'documentation_required'
    );
    if (documentationRules.length > 0) {
      for (const rule of documentationRules) {
        const docViolations = await this.validateDocumentation(symbols, rule, projectPath);
        violations.push(...docViolations);
      }
    }

    // Check for class complexity rules
    const classComplexityRules = grammar.rules.filter(
      (rule): rule is ClassComplexityRule => rule.rule === 'class_complexity'
    );
    if (classComplexityRules.length > 0) {
      for (const rule of classComplexityRules) {
        const complexityViolations = await this.validateClassComplexity(symbols, rule, projectPath);
        violations.push(...complexityViolations);
      }
    }

    // Check for minimum test ratio rules
    const minimumTestRatioRules = grammar.rules.filter(
      (rule): rule is MinimumTestRatioRule => rule.rule === 'minimum_test_ratio'
    );
    if (minimumTestRatioRules.length > 0) {
      for (const rule of minimumTestRatioRules) {
        const testRatioViolations = this.validateMinimumTestRatio(symbols, rule);
        violations.push(...testRatioViolations);
      }
    }

    // Check for granularity metric rules
    const granularityMetricRules = grammar.rules.filter(
      (rule): rule is GranularityMetricRule => rule.rule === 'granularity_metric'
    );
    if (granularityMetricRules.length > 0) {
      for (const rule of granularityMetricRules) {
        const granularityViolations = await this.validateGranularityMetric(symbols, rule, projectPath);
        violations.push(...granularityViolations);
      }
    }

    // Check each symbol's dependencies against forbidden/allowed rules
    for (const symbol of symbols) {
      for (const dependency of symbol.dependencies) {
        const dependencySymbol = symbolMap.get(dependency);
        if (!dependencySymbol) {
          // Dependency not in the analyzed codebase (external library, etc.)
          continue;
        }

        // Check if this dependency violates any rules
        const violation = this.checkDependencyAgainstRules(
          symbol,
          dependencySymbol,
          grammar.rules
        );

        if (violation) {
          violations.push(violation);
        }
      }
    }

    return violations;
  }

  /**
   * Validates that symbols follow naming pattern conventions
   *
   * For each symbol matching the 'for' role, ensures its path matches the pattern.
   * If not, creates a violation.
   *
   * @param symbols - All code symbols
   * @param rule - The naming pattern rule to check
   * @returns Array of violations for symbols not matching the pattern
   */
  private validateNamingPatterns(
    symbols: CodeSymbolModel[],
    rule: NamingPatternRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    // Compile the pattern regex
    const pattern = new RegExp(rule.pattern);

    // Find all symbols that match the 'for' role
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatches(symbol.role, rule.for.role)
    );

    // For each matching symbol, check if its path matches the pattern
    for (const symbol of symbolsToCheck) {
      if (!pattern.test(symbol.path)) {
        // Path doesn't match the pattern - create a violation
        violations.push({
          ruleName: rule.name,
          severity: rule.severity,
          file: symbol.path,
          message: `${rule.name}: ${symbol.path} (${symbol.role}) does not match naming pattern "${rule.pattern}"${rule.comment ? ` - ${rule.comment}` : ''}`,
          fromRole: symbol.role,
          toRole: undefined,
          dependency: undefined,
        });
      }
    }

    return violations;
  }

  /**
   * Checks if a dependency between two symbols violates any architectural rules
   *
   * @param fromSymbol - Source symbol (the one with the dependency)
   * @param toSymbol - Target symbol (the one being depended upon)
   * @param rules - Array of architectural rules
   * @returns Violation if any rule is broken, null otherwise
   */
  private checkDependencyAgainstRules(
    fromSymbol: CodeSymbolModel,
    toSymbol: CodeSymbolModel,
    rules: ArchitecturalRuleModel[]
  ): ArchitecturalViolationModel | null {
    for (const rule of rules) {
      // Skip non-dependency rules (hygiene and naming rules are handled separately)
      if (
        rule.rule === 'naming_pattern' ||
        rule.rule === 'find_synonyms' ||
        rule.rule === 'detect_unreferenced' ||
        rule.rule === 'file_size' ||
        rule.rule === 'test_coverage' ||
        rule.rule === 'forbidden_keywords' ||
        rule.rule === 'required_structure' ||
        rule.rule === 'documentation_required' ||
        rule.rule === 'class_complexity' ||
        rule.rule === 'minimum_test_ratio' ||
        rule.rule === 'granularity_metric'
      ) {
        continue;
      }

      // Type guard: we now know it's a DependencyRule
      const depRule = rule as DependencyRule;

      // Skip circular dependency rules (handled separately)
      if ('circular' in depRule.to && depRule.to.circular) {
        continue;
      }

      // Skip required rules (handled separately)
      if (depRule.rule === 'required') {
        continue;
      }

      // Check if this rule applies to these symbols
      const fromRoleMatches = this.roleMatches(fromSymbol.role, depRule.from.role);
      const toRoleMatches = this.roleMatches(toSymbol.role, depRule.to.role);

      if (fromRoleMatches && toRoleMatches) {
        // This rule applies to this dependency
        if (depRule.rule === 'forbidden') {
          // This is a forbidden dependency - it's a violation!
          return {
            ruleName: depRule.name,
            severity: depRule.severity,
            file: fromSymbol.path,
            message: `${depRule.name}: ${fromSymbol.path} (${fromSymbol.role}) cannot depend on ${toSymbol.path} (${toSymbol.role})${depRule.comment ? ` - ${depRule.comment}` : ''}`,
            fromRole: fromSymbol.role,
            toRole: toSymbol.role,
            dependency: toSymbol.path,
          };
        }
        // Note: 'allowed' rules need different logic if we want to enforce whitelist-only dependencies
      }
    }

    return null;
  }

  /**
   * Validates that required dependencies exist
   *
   * For each symbol matching the 'from' role, ensures it has at least one dependency
   * matching the 'to' role. If not, creates a violation.
   *
   * @param symbols - All code symbols
   * @param symbolMap - Map for quick symbol lookup
   * @param rule - The required dependency rule to check
   * @returns Array of violations for missing required dependencies
   */
  private validateRequiredDependencies(
    symbols: CodeSymbolModel[],
    symbolMap: Map<string, CodeSymbolModel>,
    rule: DependencyRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    // Skip circular rules (they don't have a standard 'to.role')
    if ('circular' in rule.to && rule.to.circular) {
      return violations;
    }

    // Find all symbols that match the 'from' role
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatches(symbol.role, rule.from.role)
    );

    // For each matching symbol, check if it has at least one required dependency
    for (const symbol of symbolsToCheck) {
      // Check if any of this symbol's dependencies match the 'to' role
      const hasRequiredDependency = symbol.dependencies.some((depPath) => {
        const depSymbol = symbolMap.get(depPath);
        if (!depSymbol) return false; // External dependency, skip

        // Type guard: ensure rule.to has role property
        if (!('role' in rule.to) || !rule.to.role) return false;

        return this.roleMatches(depSymbol.role, rule.to.role);
      });

      // If no required dependency found, create a violation
      if (!hasRequiredDependency) {
        // Type guard: ensure rule.to has role property
        if (!('role' in rule.to) || !rule.to.role) continue;

        const roleDescription = Array.isArray(rule.to.role)
          ? rule.to.role.join(' or ')
          : rule.to.role;

        violations.push({
          ruleName: rule.name,
          severity: rule.severity,
          file: symbol.path,
          message: `${rule.name}: ${symbol.path} (${symbol.role}) must depend on at least one ${roleDescription}${rule.comment ? ` - ${rule.comment}` : ''}`,
          fromRole: symbol.role,
          toRole: roleDescription,
          dependency: undefined,
        });
      }
    }

    return violations;
  }

  /**
   * Detects circular dependencies using Depth-First Search (DFS)
   *
   * Algorithm:
   * - Uses three states: WHITE (unvisited), GRAY (visiting), BLACK (visited)
   * - If we encounter a GRAY node during DFS, we have found a cycle
   *
   * @param symbols - All code symbols
   * @param symbolMap - Map for quick symbol lookup
   * @param rule - The circular dependency rule to check
   * @returns Array of violations for circular dependencies found
   */
  private detectCircularDependencies(
    symbols: CodeSymbolModel[],
    symbolMap: Map<string, CodeSymbolModel>,
    rule: DependencyRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    // Track the state of each symbol during DFS
    enum VisitState {
      WHITE = 'WHITE', // Not visited
      GRAY = 'GRAY',   // Currently visiting (in recursion stack)
      BLACK = 'BLACK', // Completely visited
    }

    const state = new Map<string, VisitState>();

    // Initialize all symbols as WHITE
    symbols.forEach((symbol) => {
      state.set(symbol.path, VisitState.WHITE);
    });

    /**
     * DFS visit function
     * Returns the path where a cycle was detected, or null if no cycle
     */
    const dfsVisit = (symbolPath: string, path: string[]): string[] | null => {
      const symbol = symbolMap.get(symbolPath);
      if (!symbol) return null;

      // Check if this symbol should be checked according to the rule
      const shouldCheck = this.roleMatches(symbol.role, rule.from.role);
      if (!shouldCheck) {
        state.set(symbolPath, VisitState.BLACK);
        return null;
      }

      // Mark as currently visiting
      state.set(symbolPath, VisitState.GRAY);
      path.push(symbolPath);

      // Visit all dependencies
      for (const depPath of symbol.dependencies) {
        const depSymbol = symbolMap.get(depPath);
        if (!depSymbol) continue; // External dependency

        const depState = state.get(depPath);

        if (depState === VisitState.GRAY) {
          // Found a cycle! Build the cycle path
          const cycleStart = path.indexOf(depPath);
          if (cycleStart !== -1) {
            return [...path.slice(cycleStart), depPath];
          }
        } else if (depState === VisitState.WHITE) {
          const cyclePath = dfsVisit(depPath, [...path]);
          if (cyclePath) {
            return cyclePath;
          }
        }
      }

      // Mark as completely visited
      state.set(symbolPath, VisitState.BLACK);
      return null;
    };

    // Run DFS from each unvisited symbol
    for (const symbol of symbols) {
      if (state.get(symbol.path) === VisitState.WHITE) {
        const cyclePath = dfsVisit(symbol.path, []);
        if (cyclePath && cyclePath.length > 0) {
          // Create a violation for this cycle
          const cycleDescription = cyclePath.join(' → ');
          violations.push({
            ruleName: rule.name,
            severity: rule.severity,
            file: cyclePath[0],
            message: `${rule.name}: Circular dependency detected: ${cycleDescription}${rule.comment ? ` - ${rule.comment}` : ''}`,
            fromRole: symbolMap.get(cyclePath[0])?.role,
            toRole: symbolMap.get(cyclePath[cyclePath.length - 1])?.role,
            dependency: cycleDescription,
          });

          // Mark all symbols in the cycle as visited to avoid duplicate reports
          cyclePath.forEach((path) => state.set(path, VisitState.BLACK));
        }
      }
    }

    return violations;
  }

  /**
   * Validates that symbols don't have very similar names (potential duplicates)
   *
   * Uses string similarity algorithms to detect classes with synonymous names
   * that might indicate code duplication or architectural confusion.
   *
   * @param symbols - All code symbols
   * @param rule - The synonym detection rule to check
   * @returns Array of violations for symbols with similar names
   */
  private validateSynonyms(
    symbols: CodeSymbolModel[],
    rule: SynonymDetectionRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    // Find all symbols that match the 'for' role
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatches(symbol.role, rule.for.role)
    );

    // Compare each symbol with every other symbol
    for (let i = 0; i < symbolsToCheck.length; i++) {
      for (let j = i + 1; j < symbolsToCheck.length; j++) {
        const symbol1 = symbolsToCheck[i];
        const symbol2 = symbolsToCheck[j];

        // Extract class/file names from paths
        const name1 = this.extractFileName(symbol1.path);
        const name2 = this.extractFileName(symbol2.path);

        // Normalize names (remove common suffixes, apply thesaurus)
        const normalized1 = this.normalizeName(name1, rule.options.thesaurus);
        const normalized2 = this.normalizeName(name2, rule.options.thesaurus);

        // Calculate similarity
        const similarity = this.calculateSimilarity(normalized1, normalized2);

        // Check if similarity exceeds threshold
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
   *
   * Analyzes the dependency graph to find files that are not imported
   * by any other file in the project, indicating potentially dead code.
   *
   * @param symbols - All code symbols
   * @param rule - The unreferenced code detection rule
   * @returns Array of violations for unreferenced files
   */
  private detectUnreferencedCode(
    symbols: CodeSymbolModel[],
    rule: UnreferencedCodeRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    // Build reverse dependency map (who imports each file)
    const incomingReferences = new Map<string, number>();

    // Initialize all symbols with 0 references
    symbols.forEach((symbol) => {
      incomingReferences.set(symbol.path, 0);
    });

    // Count incoming references for each symbol
    symbols.forEach((symbol) => {
      symbol.dependencies.forEach((depPath) => {
        const current = incomingReferences.get(depPath) || 0;
        incomingReferences.set(depPath, current + 1);
      });
    });

    // Find symbols with the specified role that have zero references
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatches(symbol.role, rule.for.role)
    );

    for (const symbol of symbolsToCheck) {
      const refCount = incomingReferences.get(symbol.path) || 0;

      // Skip if file has references
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

      // Found a zombie file!
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

  /**
   * Extracts the file name from a path (without directory and extension)
   *
   * @param path - File path
   * @returns File name
   */
  private extractFileName(path: string): string {
    // Get last segment after /
    const segments = path.split('/');
    const fileWithExt = segments[segments.length - 1];

    // Remove extension
    return fileWithExt.replace(/\.(ts|js|tsx|jsx)$/, '');
  }

  /**
   * Normalizes a name by removing common suffixes and applying thesaurus
   *
   * @param name - Original name
   * @param thesaurus - Optional groups of synonyms
   * @returns Normalized name
   */
  private normalizeName(name: string, thesaurus?: string[][]): string {
    // Convert to lowercase for case-insensitive comparison
    let normalized = name.toLowerCase();

    // Remove common suffixes
    const suffixes = [
      'usecase',
      'use-case',
      'implementation',
      'impl',
      'adapter',
      'repository',
      'controller',
      'service',
      'factory',
      'builder',
      'creator',
      'generator',
    ];

    for (const suffix of suffixes) {
      normalized = normalized.replace(new RegExp(`[-_.]?${suffix}$`), '');
    }

    // Apply thesaurus substitution
    if (thesaurus) {
      for (const synonymGroup of thesaurus) {
        const lowerGroup = synonymGroup.map((s) => s.toLowerCase());
        // If any synonym is found, replace with the first one (canonical form)
        for (let i = 1; i < lowerGroup.length; i++) {
          const pattern = new RegExp(`\\b${lowerGroup[i]}\\b`, 'g');
          normalized = normalized.replace(pattern, lowerGroup[0]);
        }
      }
    }

    return normalized;
  }

  /**
   * Calculates string similarity using Jaro-Winkler distance
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score between 0.0 and 1.0
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Handle edge cases
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    // Use Jaro similarity algorithm
    const jaroSimilarity = this.jaroSimilarity(str1, str2);

    // Apply Winkler modification (boost for common prefix)
    const prefixLength = this.commonPrefixLength(str1, str2, 4);
    const jaroWinkler = jaroSimilarity + prefixLength * 0.1 * (1 - jaroSimilarity);

    return Math.min(jaroWinkler, 1.0);
  }

  /**
   * Calculates Jaro similarity between two strings
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Jaro similarity score
   */
  private jaroSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Maximum allowed distance for matching characters
    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Identify matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, len2);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    return (
      (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3.0
    );
  }

  /**
   * Calculates the length of common prefix between two strings
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @param maxLength - Maximum prefix length to consider
   * @returns Length of common prefix
   */
  private commonPrefixLength(str1: string, str2: string, maxLength: number): number {
    let prefixLength = 0;
    const minLength = Math.min(str1.length, str2.length, maxLength);

    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) {
        prefixLength++;
      } else {
        break;
      }
    }

    return prefixLength;
  }

  /**
   * Checks if a symbol's role matches a role reference (can be string or array)
   *
   * @param symbolRole - The role of a symbol
   * @param ruleRole - The role reference from a rule (string or string[])
   * @returns True if the symbol role matches the rule role
   */
  private roleMatches(symbolRole: string, ruleRole: RoleReference): boolean {
    if (ruleRole === 'ALL') {
      return true; // Match any role
    }
    if (Array.isArray(ruleRole)) {
      return ruleRole.includes(symbolRole);
    }
    return symbolRole === ruleRole;
  }

  /**
   * Validates file size limits
   *
   * @param symbols - Code symbols
   * @param rule - File size rule
   * @param projectPath - Project path
   * @returns Array of violations for files exceeding size limits
   */
  private async validateFileSize(
    symbols: CodeSymbolModel[],
    rule: FileSizeRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    // Find symbols matching the role
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatches(symbol.role, rule.for.role)
    );

    for (const symbol of symbolsToCheck) {
      try {
        const filePath = path.join(projectPath, symbol.path);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').length;

        if (lines > rule.max_lines) {
          violations.push({
            ruleName: rule.name,
            severity: rule.severity,
            file: symbol.path,
            message: `${rule.name}: File ${symbol.path} has ${lines} lines (exceeds ${rule.max_lines} limit)${rule.comment ? ` - ${rule.comment}` : ''}`,
            fromRole: symbol.role,
            toRole: undefined,
            dependency: undefined,
          });
        }
      } catch (error) {
        // File might not exist or be readable, skip
      }
    }

    return violations;
  }

  /**
   * Validates test coverage
   *
   * @param symbols - Code symbols
   * @param rule - Test coverage rule
   * @param projectPath - Project path
   * @returns Array of violations for missing test files
   */
  private async validateTestCoverage(
    symbols: CodeSymbolModel[],
    rule: TestCoverageRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    // Find symbols matching the from role
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatches(symbol.role, rule.from.role)
    );

    for (const symbol of symbolsToCheck) {
      // Check for corresponding test file
      const testPatterns = [
        symbol.path.replace(/\.ts$/, '.spec.ts'),
        symbol.path.replace(/\.ts$/, '.test.ts'),
        symbol.path.replace(/^src\//, 'tests/').replace(/\.ts$/, '.spec.ts'),
        symbol.path.replace(/^src\//, 'tests/').replace(/\.ts$/, '.test.ts'),
      ];

      let hasTest = false;
      for (const testPath of testPatterns) {
        try {
          const fullPath = path.join(projectPath, testPath);
          await fs.access(fullPath);
          hasTest = true;
          break;
        } catch {
          // Test file doesn't exist, continue checking
        }
      }

      if (!hasTest) {
        violations.push({
          ruleName: rule.name,
          severity: rule.severity,
          file: symbol.path,
          message: `${rule.name}: ${symbol.path} has no corresponding test file${rule.comment ? ` - ${rule.comment}` : ''}`,
          fromRole: symbol.role,
          toRole: undefined,
          dependency: undefined,
        });
      }
    }

    return violations;
  }

  /**
   * Validates forbidden keywords in code
   *
   * @param symbols - Code symbols
   * @param rule - Forbidden keywords rule
   * @param projectPath - Project path
   * @returns Array of violations for forbidden keywords found
   */
  private async validateForbiddenKeywords(
    symbols: CodeSymbolModel[],
    rule: ForbiddenKeywordsRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    // Find symbols matching the from role
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatches(symbol.role, rule.from.role)
    );

    for (const symbol of symbolsToCheck) {
      try {
        const filePath = path.join(projectPath, symbol.path);
        const content = await fs.readFile(filePath, 'utf-8');

        for (const keyword of rule.contains_forbidden) {
          if (content.includes(keyword)) {
            violations.push({
              ruleName: rule.name,
              severity: rule.severity,
              file: symbol.path,
              message: `${rule.name}: ${symbol.path} contains forbidden keyword '${keyword}'${rule.comment ? ` - ${rule.comment}` : ''}`,
              fromRole: symbol.role,
              toRole: undefined,
              dependency: undefined,
            });
            break; // Only report once per file
          }
        }
      } catch (error) {
        // File might not exist or be readable, skip
      }
    }

    return violations;
  }

  /**
   * Validates required directory structure
   *
   * @param rule - Required structure rule
   * @param projectPath - Project path
   * @returns Array of violations for missing directories
   */
  private async validateRequiredStructure(
    rule: RequiredStructureRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    for (const requiredDir of rule.required_directories) {
      try {
        const dirPath = path.join(projectPath, requiredDir);
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          violations.push({
            ruleName: rule.name,
            severity: rule.severity,
            file: requiredDir,
            message: `${rule.name}: Required directory '${requiredDir}' does not exist${rule.comment ? ` - ${rule.comment}` : ''}`,
            fromRole: undefined,
            toRole: undefined,
            dependency: undefined,
          });
        }
      } catch {
        violations.push({
          ruleName: rule.name,
          severity: rule.severity,
          file: requiredDir,
          message: `${rule.name}: Required directory '${requiredDir}' does not exist${rule.comment ? ` - ${rule.comment}` : ''}`,
          fromRole: undefined,
          toRole: undefined,
          dependency: undefined,
        });
      }
    }

    return violations;
  }

  /**
   * Validates documentation requirements
   *
   * @param symbols - Code symbols
   * @param rule - Documentation required rule
   * @param projectPath - Project path
   * @returns Array of violations for missing documentation
   */
  private async validateDocumentation(
    symbols: CodeSymbolModel[],
    rule: DocumentationRequiredRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    // Find symbols matching the role
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatches(symbol.role, rule.for.role)
    );

    for (const symbol of symbolsToCheck) {
      try {
        const filePath = path.join(projectPath, symbol.path);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').length;

        if (lines >= rule.min_lines) {
          // Check for JSDoc
          if (rule.requires_jsdoc && !content.includes('/**')) {
            violations.push({
              ruleName: rule.name,
              severity: rule.severity,
              file: symbol.path,
              message: `${rule.name}: ${symbol.path} (${lines} lines) lacks JSDoc documentation${rule.comment ? ` - ${rule.comment}` : ''}`,
              fromRole: symbol.role,
              toRole: undefined,
              dependency: undefined,
            });
          }
        }
      } catch (error) {
        // File might not exist or be readable, skip
      }
    }

    return violations;
  }

  /**
   * Validates class complexity (God Object prevention)
   *
   * @param symbols - Code symbols
   * @param rule - Class complexity rule
   * @param projectPath - Project path
   * @returns Array of violations for complex classes
   */
  private async validateClassComplexity(
    symbols: CodeSymbolModel[],
    rule: ClassComplexityRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    // Find symbols matching the role
    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatches(symbol.role, rule.for.role)
    );

    for (const symbol of symbolsToCheck) {
      try {
        const filePath = path.join(projectPath, symbol.path);
        const content = await fs.readFile(filePath, 'utf-8');

        // Simple regex-based counting (could be improved with proper AST parsing)
        const publicMethodPattern = /public\s+\w+\s*\(/g;
        const publicMethods = content.match(publicMethodPattern) || [];

        const propertyPattern = /(?:public|private|protected)?\s+\w+\s*[:=]/g;
        const properties = content.match(propertyPattern) || [];

        if (publicMethods.length > rule.max_public_methods) {
          violations.push({
            ruleName: rule.name,
            severity: rule.severity,
            file: symbol.path,
            message: `${rule.name}: ${symbol.path} has ${publicMethods.length} public methods (exceeds ${rule.max_public_methods})${rule.comment ? ` - ${rule.comment}` : ''}`,
            fromRole: symbol.role,
            toRole: undefined,
            dependency: undefined,
          });
        }

        if (properties.length > rule.max_properties) {
          violations.push({
            ruleName: rule.name,
            severity: rule.severity,
            file: symbol.path,
            message: `${rule.name}: ${symbol.path} has ${properties.length} properties (exceeds ${rule.max_properties})${rule.comment ? ` - ${rule.comment}` : ''}`,
            fromRole: symbol.role,
            toRole: undefined,
            dependency: undefined,
          });
        }
      } catch (error) {
        // File might not exist or be readable, skip
      }
    }

    return violations;
  }

  /**
   * Validates minimum test ratio requirements
   *
   * @param symbols - Code symbols
   * @param rule - Minimum test ratio rule
   * @returns Array of violations if test ratio is below requirement
   */
  private validateMinimumTestRatio(
    symbols: CodeSymbolModel[],
    rule: MinimumTestRatioRule
  ): ArchitecturalViolationModel[] {
    const violations: ArchitecturalViolationModel[] = [];

    // Classify files as test or production
    const testFiles = symbols.filter((symbol) =>
      symbol.path.includes('.spec.') ||
      symbol.path.includes('.test.') ||
      symbol.path.startsWith('tests/') ||
      symbol.path.startsWith('test/')
    );

    const productionFiles = symbols.filter((symbol) =>
      !symbol.path.includes('.spec.') &&
      !symbol.path.includes('.test.') &&
      !symbol.path.startsWith('tests/') &&
      !symbol.path.startsWith('test/')
    );

    // Calculate ratio
    if (productionFiles.length === 0) {
      // No production files, no violation
      return violations;
    }

    const currentRatio = testFiles.length / productionFiles.length;
    const requiredRatio = rule.global.test_ratio;

    if (currentRatio < requiredRatio) {
      violations.push({
        ruleName: rule.name,
        severity: rule.severity,
        file: 'PROJECT',
        message: `${rule.name}: Test ratio is ${currentRatio.toFixed(2)} (${testFiles.length} test files / ${productionFiles.length} production files), minimum required: ${requiredRatio}${rule.comment ? ` - ${rule.comment}` : ''}`,
        fromRole: undefined,
        toRole: undefined,
        dependency: undefined,
      });
    }

    return violations;
  }

  /**
   * Validates file granularity metrics
   *
   * @param symbols - Code symbols
   * @param rule - Granularity metric rule
   * @param projectPath - Project path
   * @returns Array of violations if average file size exceeds threshold
   */
  private async validateGranularityMetric(
    symbols: CodeSymbolModel[],
    rule: GranularityMetricRule,
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    // Skip empty projects
    if (symbols.length === 0) {
      return violations;
    }

    // Calculate average lines per file
    let totalLines = 0;
    let fileCount = 0;

    for (const symbol of symbols) {
      try {
        const filePath = path.join(projectPath, symbol.path);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').length;
        totalLines += lines;
        fileCount++;
      } catch (error) {
        // File might not exist or be readable, skip
      }
    }

    // If no files could be read, no violation
    if (fileCount === 0) {
      return violations;
    }

    const averageLinesPerFile = totalLines / fileCount;
    const targetLoc = rule.global.target_loc_per_file;
    const threshold = targetLoc * rule.global.warning_threshold_multiplier;

    if (averageLinesPerFile > threshold) {
      violations.push({
        ruleName: rule.name,
        severity: rule.severity,
        file: 'PROJECT',
        message: `${rule.name}: Average lines per file: ${Math.round(averageLinesPerFile)}, target: ${targetLoc} (threshold: ${Math.round(threshold)})${rule.comment ? ` - ${rule.comment}` : ''}`,
        fromRole: undefined,
        toRole: undefined,
        dependency: undefined,
      });
    }

    return violations;
  }
}

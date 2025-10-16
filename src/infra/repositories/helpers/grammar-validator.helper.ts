/**
 * Grammar Validator Helper
 *
 * Validates grammar structure, roles, and rules according to the grammar specification.
 */

export class GrammarValidatorHelper {
  /**
   * Validates the parsed YAML content
   *
   * @param content - Parsed YAML content
   * @param filePath - Path to the grammar file (for error messages)
   * @throws Error if the content is invalid
   */
  validate(content: any, filePath: string): void {
    this.validateRequiredFields(content, filePath);
    this.validateRoles(content.roles, filePath);
    this.validateRules(content.rules, filePath);
  }

  /**
   * Validates required top-level fields
   */
  private validateRequiredFields(content: any, filePath: string): void {
    if (!content.version) {
      throw new Error(`Missing required field 'version' in ${filePath}`);
    }

    if (!content.language) {
      throw new Error(`Missing required field 'language' in ${filePath}`);
    }

    if (!Array.isArray(content.roles)) {
      throw new Error(`Missing or invalid 'roles' array in ${filePath}`);
    }

    if (!Array.isArray(content.rules)) {
      throw new Error(`Missing or invalid 'rules' array in ${filePath}`);
    }
  }

  /**
   * Validates roles array
   */
  private validateRoles(roles: any[], filePath: string): void {
    for (const role of roles) {
      if (!role.name || typeof role.name !== 'string') {
        throw new Error(`Invalid role: missing or invalid 'name' in ${filePath}`);
      }
      if (!role.path || typeof role.path !== 'string') {
        throw new Error(`Invalid role '${role.name}': missing or invalid 'path' in ${filePath}`);
      }
    }
  }

  /**
   * Validates rules array
   */
  private validateRules(rules: any[], filePath: string): void {
    for (const rule of rules) {
      this.validateBaseRule(rule, filePath);
      this.validateRuleByType(rule, filePath);
    }
  }

  /**
   * Validates base rule properties
   */
  private validateBaseRule(rule: any, filePath: string): void {
    if (!rule.name || typeof rule.name !== 'string') {
      throw new Error(`Invalid rule: missing or invalid 'name' in ${filePath}`);
    }
    if (!rule.severity || !['error', 'warning', 'info'].includes(rule.severity)) {
      throw new Error(
        `Invalid rule '${rule.name}': severity must be 'error', 'warning', or 'info' in ${filePath}`
      );
    }
    if (!rule.rule || typeof rule.rule !== 'string') {
      throw new Error(`Invalid rule '${rule.name}': missing 'rule' type in ${filePath}`);
    }
  }

  /**
   * Validates rule based on its type
   */
  private validateRuleByType(rule: any, filePath: string): void {
    const validators: Record<string, (rule: any, filePath: string) => void> = {
      naming_pattern: this.validateNamingPatternRule.bind(this),
      find_synonyms: this.validateFindSynonymsRule.bind(this),
      detect_unreferenced: this.validateDetectUnreferencedRule.bind(this),
      file_size: this.validateFileSizeRule.bind(this),
      test_coverage: this.validateTestCoverageRule.bind(this),
      forbidden_keywords: this.validateForbiddenKeywordsRule.bind(this),
      required_structure: this.validateRequiredStructureRule.bind(this),
      documentation_required: this.validateDocumentationRequiredRule.bind(this),
      class_complexity: this.validateClassComplexityRule.bind(this),
      minimum_test_ratio: this.validateMinimumTestRatioRule.bind(this),
      granularity_metric: this.validateGranularityMetricRule.bind(this),
      forbidden_patterns: this.validateForbiddenPatternsRule.bind(this),
      barrel_purity: this.validateBarrelPurityRule.bind(this),
    };

    if (validators[rule.rule]) {
      validators[rule.rule](rule, filePath);
    } else if (['allowed', 'forbidden', 'required'].includes(rule.rule)) {
      this.validateDependencyRule(rule, filePath);
    } else {
      throw new Error(
        `Invalid rule '${rule.name}': rule type must be 'allowed', 'forbidden', 'required', 'naming_pattern', 'find_synonyms', 'detect_unreferenced', 'file_size', 'test_coverage', 'forbidden_keywords', 'required_structure', 'documentation_required', 'class_complexity', 'minimum_test_ratio', 'granularity_metric', 'forbidden_patterns', or 'barrel_purity' in ${filePath}`
      );
    }
  }

  private validateNamingPatternRule(rule: any, filePath: string): void {
    if (!rule.for || !rule.for.role) {
      throw new Error(`Invalid rule '${rule.name}': naming_pattern rules must have 'for.role' in ${filePath}`);
    }
    if (!rule.pattern || typeof rule.pattern !== 'string') {
      throw new Error(`Invalid rule '${rule.name}': naming_pattern rules must have a 'pattern' string in ${filePath}`);
    }
    this.validateRegex(rule.pattern, rule.name, filePath);
  }

  private validateFindSynonymsRule(rule: any, filePath: string): void {
    if (!rule.for || !rule.for.role) {
      throw new Error(`Invalid rule '${rule.name}': find_synonyms rules must have 'for.role' in ${filePath}`);
    }
    if (!rule.options || typeof rule.options !== 'object') {
      throw new Error(`Invalid rule '${rule.name}': find_synonyms rules must have an 'options' object in ${filePath}`);
    }
    if (typeof rule.options.similarity_threshold !== 'number') {
      throw new Error(`Invalid rule '${rule.name}': find_synonyms rules must have 'options.similarity_threshold' as a number in ${filePath}`);
    }
    if (rule.options.similarity_threshold < 0 || rule.options.similarity_threshold > 1) {
      throw new Error(`Invalid rule '${rule.name}': similarity_threshold must be between 0 and 1 in ${filePath}`);
    }
    if (rule.options.thesaurus && !Array.isArray(rule.options.thesaurus)) {
      throw new Error(`Invalid rule '${rule.name}': options.thesaurus must be an array in ${filePath}`);
    }
  }

  private validateDetectUnreferencedRule(rule: any, filePath: string): void {
    if (!rule.for || !rule.for.role) {
      throw new Error(`Invalid rule '${rule.name}': detect_unreferenced rules must have 'for.role' in ${filePath}`);
    }
    if (rule.options && typeof rule.options !== 'object') {
      throw new Error(`Invalid rule '${rule.name}': detect_unreferenced rules 'options' must be an object in ${filePath}`);
    }
    if (rule.options?.ignore_patterns && !Array.isArray(rule.options.ignore_patterns)) {
      throw new Error(`Invalid rule '${rule.name}': options.ignore_patterns must be an array in ${filePath}`);
    }
  }

  private validateFileSizeRule(rule: any, filePath: string): void {
    if (!rule.for || !rule.for.role) {
      throw new Error(`Invalid rule '${rule.name}': file_size rules must have 'for.role' in ${filePath}`);
    }
    if (typeof rule.max_lines !== 'number' || rule.max_lines <= 0) {
      throw new Error(`Invalid rule '${rule.name}': file_size rules must have 'max_lines' as a positive number in ${filePath}`);
    }
  }

  private validateTestCoverageRule(rule: any, filePath: string): void {
    if (!rule.from || !rule.from.role) {
      throw new Error(`Invalid rule '${rule.name}': test_coverage rules must have 'from.role' in ${filePath}`);
    }
    if (!rule.to || !rule.to.test_file) {
      throw new Error(`Invalid rule '${rule.name}': test_coverage rules must have 'to.test_file' in ${filePath}`);
    }
  }

  private validateForbiddenKeywordsRule(rule: any, filePath: string): void {
    if (!rule.from || !rule.from.role) {
      throw new Error(`Invalid rule '${rule.name}': forbidden_keywords rules must have 'from.role' in ${filePath}`);
    }
    if (!Array.isArray(rule.contains_forbidden) || rule.contains_forbidden.length === 0) {
      throw new Error(`Invalid rule '${rule.name}': forbidden_keywords rules must have 'contains_forbidden' as a non-empty array in ${filePath}`);
    }
  }

  private validateRequiredStructureRule(rule: any, filePath: string): void {
    if (!Array.isArray(rule.required_directories) || rule.required_directories.length === 0) {
      throw new Error(`Invalid rule '${rule.name}': required_structure rules must have 'required_directories' as a non-empty array in ${filePath}`);
    }
  }

  private validateDocumentationRequiredRule(rule: any, filePath: string): void {
    if (!rule.for || !rule.for.role) {
      throw new Error(`Invalid rule '${rule.name}': documentation_required rules must have 'for.role' in ${filePath}`);
    }
    if (typeof rule.min_lines !== 'number' || rule.min_lines <= 0) {
      throw new Error(`Invalid rule '${rule.name}': documentation_required rules must have 'min_lines' as a positive number in ${filePath}`);
    }
    if (typeof rule.requires_jsdoc !== 'boolean') {
      throw new Error(`Invalid rule '${rule.name}': documentation_required rules must have 'requires_jsdoc' as a boolean in ${filePath}`);
    }
  }

  private validateClassComplexityRule(rule: any, filePath: string): void {
    if (!rule.for || !rule.for.role) {
      throw new Error(`Invalid rule '${rule.name}': class_complexity rules must have 'for.role' in ${filePath}`);
    }
    if (typeof rule.max_public_methods !== 'number' || rule.max_public_methods <= 0) {
      throw new Error(`Invalid rule '${rule.name}': class_complexity rules must have 'max_public_methods' as a positive number in ${filePath}`);
    }
    if (typeof rule.max_properties !== 'number' || rule.max_properties <= 0) {
      throw new Error(`Invalid rule '${rule.name}': class_complexity rules must have 'max_properties' as a positive number in ${filePath}`);
    }
  }

  private validateMinimumTestRatioRule(rule: any, filePath: string): void {
    if (!rule.global || typeof rule.global !== 'object') {
      throw new Error(`Invalid rule '${rule.name}': minimum_test_ratio rules must have a 'global' object in ${filePath}`);
    }
    if (typeof rule.global.test_ratio !== 'number' || rule.global.test_ratio < 0 || rule.global.test_ratio > 1) {
      throw new Error(`Invalid rule '${rule.name}': minimum_test_ratio rules must have 'global.test_ratio' as a number between 0 and 1 in ${filePath}`);
    }
  }

  private validateGranularityMetricRule(rule: any, filePath: string): void {
    if (!rule.global || typeof rule.global !== 'object') {
      throw new Error(`Invalid rule '${rule.name}': granularity_metric rules must have a 'global' object in ${filePath}`);
    }
    if (typeof rule.global.target_loc_per_file !== 'number' || rule.global.target_loc_per_file <= 0) {
      throw new Error(`Invalid rule '${rule.name}': granularity_metric rules must have 'global.target_loc_per_file' as a positive number in ${filePath}`);
    }
    if (typeof rule.global.warning_threshold_multiplier !== 'number' || rule.global.warning_threshold_multiplier <= 0) {
      throw new Error(`Invalid rule '${rule.name}': granularity_metric rules must have 'global.warning_threshold_multiplier' as a positive number in ${filePath}`);
    }
  }

  private validateForbiddenPatternsRule(rule: any, filePath: string): void {
    if (!rule.from || !rule.from.role) {
      throw new Error(`Invalid rule '${rule.name}': forbidden_patterns rules must have 'from.role' in ${filePath}`);
    }
    if (!Array.isArray(rule.contains_forbidden) || rule.contains_forbidden.length === 0) {
      throw new Error(`Invalid rule '${rule.name}': forbidden_patterns rules must have 'contains_forbidden' as a non-empty array in ${filePath}`);
    }
    for (const pattern of rule.contains_forbidden) {
      this.validateRegex(pattern, rule.name, filePath);
    }
  }

  private validateBarrelPurityRule(rule: any, filePath: string): void {
    if (!rule.for || !rule.for.file_pattern) {
      throw new Error(`Invalid rule '${rule.name}': barrel_purity rules must have 'for.file_pattern' in ${filePath}`);
    }
    this.validateRegex(rule.for.file_pattern, rule.name, filePath);
    if (!Array.isArray(rule.contains_forbidden) || rule.contains_forbidden.length === 0) {
      throw new Error(`Invalid rule '${rule.name}': barrel_purity rules must have 'contains_forbidden' as a non-empty array in ${filePath}`);
    }
    for (const pattern of rule.contains_forbidden) {
      this.validateRegex(pattern, rule.name, filePath);
    }
  }

  private validateDependencyRule(rule: any, filePath: string): void {
    if (!rule.from || !rule.from.role) {
      throw new Error(`Invalid rule '${rule.name}': dependency rules must have 'from.role' in ${filePath}`);
    }
    if (!rule.to || (!rule.to.role && !rule.to.circular)) {
      throw new Error(`Invalid rule '${rule.name}': dependency rules must have 'to.role' or 'to.circular' in ${filePath}`);
    }
    if (rule.to.role && rule.to.circular) {
      throw new Error(`Invalid rule '${rule.name}': 'to' cannot have both 'role' and 'circular' in ${filePath}`);
    }
  }

  private validateRegex(pattern: string, ruleName: string, filePath: string): void {
    try {
      new RegExp(pattern);
    } catch (error) {
      throw new Error(`Invalid rule '${ruleName}': pattern is not a valid regular expression in ${filePath}`);
    }
  }
}

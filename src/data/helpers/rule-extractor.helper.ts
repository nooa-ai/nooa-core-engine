/**
 * Rule Extractor Helper
 *
 * Extracts and categorizes rules from grammar by type.
 */
import {
  ArchitecturalRuleModel,
  DependencyRule,
  NamingPatternRule,
  SynonymDetectionRule,
  UnreferencedCodeRule,
  FileSizeRule,
  TestCoverageRule,
  ForbiddenKeywordsRule,
  RequiredStructureRule,
  DocumentationRequiredRule,
  ClassComplexityRule,
  MinimumTestRatioRule,
  GranularityMetricRule,
  ForbiddenPatternsRule,
  BarrelPurityRule,
} from '../../domain/models';

export interface ExtractedRules {
  namingPatternRules: NamingPatternRule[];
  dependencyRules: DependencyRule[];
  synonymRules: SynonymDetectionRule[];
  unreferencedRules: UnreferencedCodeRule[];
  fileSizeRules: FileSizeRule[];
  testCoverageRules: TestCoverageRule[];
  forbiddenKeywordsRules: ForbiddenKeywordsRule[];
  requiredStructureRules: RequiredStructureRule[];
  documentationRules: DocumentationRequiredRule[];
  classComplexityRules: ClassComplexityRule[];
  minimumTestRatioRules: MinimumTestRatioRule[];
  granularityMetricRules: GranularityMetricRule[];
  forbiddenPatternsRules: ForbiddenPatternsRule[];
  barrelPurityRules: BarrelPurityRule[];
}

export class RuleExtractorHelper {
  /**
   * Extracts and categorizes all rules from grammar
   */
  extract(rules: ArchitecturalRuleModel[]): ExtractedRules {
    return {
      namingPatternRules: rules.filter(
        (rule): rule is NamingPatternRule => rule.rule === 'naming_pattern'
      ),
      dependencyRules: rules.filter(
        (rule): rule is DependencyRule =>
          rule.rule === 'forbidden' || rule.rule === 'required' || rule.rule === 'allowed'
      ),
      synonymRules: rules.filter(
        (rule): rule is SynonymDetectionRule => rule.rule === 'find_synonyms'
      ),
      unreferencedRules: rules.filter(
        (rule): rule is UnreferencedCodeRule => rule.rule === 'detect_unreferenced'
      ),
      fileSizeRules: rules.filter((rule): rule is FileSizeRule => rule.rule === 'file_size'),
      testCoverageRules: rules.filter(
        (rule): rule is TestCoverageRule => rule.rule === 'test_coverage'
      ),
      forbiddenKeywordsRules: rules.filter(
        (rule): rule is ForbiddenKeywordsRule => rule.rule === 'forbidden_keywords'
      ),
      requiredStructureRules: rules.filter(
        (rule): rule is RequiredStructureRule => rule.rule === 'required_structure'
      ),
      documentationRules: rules.filter(
        (rule): rule is DocumentationRequiredRule => rule.rule === 'documentation_required'
      ),
      classComplexityRules: rules.filter(
        (rule): rule is ClassComplexityRule => rule.rule === 'class_complexity'
      ),
      minimumTestRatioRules: rules.filter(
        (rule): rule is MinimumTestRatioRule => rule.rule === 'minimum_test_ratio'
      ),
      granularityMetricRules: rules.filter(
        (rule): rule is GranularityMetricRule => rule.rule === 'granularity_metric'
      ),
      forbiddenPatternsRules: rules.filter(
        (rule): rule is ForbiddenPatternsRule => rule.rule === 'forbidden_patterns'
      ),
      barrelPurityRules: rules.filter(
        (rule): rule is BarrelPurityRule => rule.rule === 'barrel_purity'
      ),
    };
  }
}

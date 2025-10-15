/**
 * Represents the complete grammar configuration loaded from nooa.grammar.yaml
 */

import { RoleDefinitionModel } from './role-definition.model';
import { ArchitecturalRuleModel } from './architectural-rule.model';

/**
 * Complete grammar configuration for architectural validation
 */
export type GrammarModel = {
  /** Version of the grammar specification */
  version: string;

  /** Programming language being analyzed */
  language: string;

  /** Role definitions that map paths to architectural roles */
  roles: RoleDefinitionModel[];

  /** Architectural rules that define allowed/forbidden dependencies */
  rules: ArchitecturalRuleModel[];
};

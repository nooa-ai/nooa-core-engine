import { GrammarModel } from '../models/grammar.model';
import { makeArchitecturalRuleMock } from './architectural-rule.mock';
import { makeRoleDefinitionMock } from './role-definition.mock';

export const makeGrammarMock = (
  overrides: Partial<GrammarModel> = {},
): GrammarModel => ({
  version: overrides.version ?? '1.0.0',
  language: overrides.language ?? 'typescript',
  roles: overrides.roles ?? [makeRoleDefinitionMock()],
  rules: overrides.rules ?? [makeArchitecturalRuleMock()],
});

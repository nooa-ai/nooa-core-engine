import { RoleDefinitionModel } from '../models/role-definition.model';

const baseRoleDefinition: RoleDefinitionModel = {
  name: 'SERVICE',
  path: '^src/sample/service',
  description: 'Sample service layer role.',
};

export const makeRoleDefinitionMock = (
  overrides: Partial<RoleDefinitionModel> = {},
): RoleDefinitionModel => ({
  ...baseRoleDefinition,
  ...overrides,
});

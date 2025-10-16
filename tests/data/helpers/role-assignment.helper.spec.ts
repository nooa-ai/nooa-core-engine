/**
 * Unit tests for RoleAssignmentHelper
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { RoleAssignmentHelper } from '../../../src/data/helpers/role-assignment.helper';
import { CodeSymbolModel, GrammarModel, RoleDefinitionModel } from '../../../src/domain/models';

describe('RoleAssignmentHelper', () => {
  let sut: RoleAssignmentHelper;

  beforeEach(() => {
    sut = new RoleAssignmentHelper();
  });

  const makeGrammar = (roles: RoleDefinitionModel[]): GrammarModel => ({
    version: '1.0',
    language: 'typescript',
    roles,
    rules: [],
  });

  const makeSymbol = (overrides: Partial<CodeSymbolModel>): CodeSymbolModel => ({
    path: 'src/example.ts',
    name: 'Example',
    role: 'UNKNOWN',
    dependencies: [],
    ...overrides,
  });

  describe('assign', () => {
    it('should assign role based on matching path pattern', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'CONTROLLER', path: '^src/presentation/controllers' },
        { name: 'USE_CASE', path: '^src/data/usecases' },
        { name: 'DOMAIN', path: '^src/domain' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'src/presentation/controllers/user.controller.ts' }),
        makeSymbol({ path: 'src/data/usecases/create-user.usecase.ts' }),
        makeSymbol({ path: 'src/domain/models/user.model.ts' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].role).toBe('CONTROLLER');
      expect(result[1].role).toBe('USE_CASE');
      expect(result[2].role).toBe('DOMAIN');
    });

    it('should assign "UNKNOWN" when no pattern matches', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'CONTROLLER', path: '^src/presentation/controllers' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'tests/unit/example.spec.ts' }),
        makeSymbol({ path: 'config/settings.ts' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].role).toBe('UNKNOWN');
      expect(result[1].role).toBe('UNKNOWN');
    });

    it('should use first matching role when multiple patterns match', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'SPECIFIC', path: '^src/data/usecases/user' },
        { name: 'GENERAL', path: '^src/data' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'src/data/usecases/user/create.ts' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      // Should use first matching pattern (SPECIFIC)
      expect(result[0].role).toBe('SPECIFIC');
    });

    it('should handle empty symbols array', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'CONTROLLER', path: '^src/presentation/controllers' },
      ];

      const symbols: CodeSymbolModel[] = [];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result).toEqual([]);
    });

    it('should handle empty roles array', () => {
      const roles: RoleDefinitionModel[] = [];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'src/example.ts' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].role).toBe('UNKNOWN');
    });

    it('should handle complex regex patterns', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'CONTROLLER', path: '\\.controller\\.ts$' },
        { name: 'SERVICE', path: '\\.service\\.ts$' },
        { name: 'MODEL', path: '/models?/' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'src/presentation/user.controller.ts' }),
        makeSymbol({ path: 'src/data/user.service.ts' }),
        makeSymbol({ path: 'src/domain/model/user.ts' }),
        makeSymbol({ path: 'src/domain/models/product.ts' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].role).toBe('CONTROLLER');
      expect(result[1].role).toBe('SERVICE');
      expect(result[2].role).toBe('MODEL');
      expect(result[3].role).toBe('MODEL');
    });

    it('should preserve all symbol properties', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'DOMAIN', path: '^src/domain' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({
          path: 'src/domain/user.ts',
          name: 'User',
          dependencies: ['src/domain/email.ts', 'src/domain/password.ts'],
        }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0]).toEqual({
        path: 'src/domain/user.ts',
        name: 'User',
        role: 'DOMAIN',
        dependencies: ['src/domain/email.ts', 'src/domain/password.ts'],
      });
    });

    it('should handle paths with special characters', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'SPECIAL', path: '^src/special-folder' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'src/special-folder/file-name.ts' }),
        makeSymbol({ path: 'src/special_folder/file_name.ts' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].role).toBe('SPECIAL');
      expect(result[1].role).toBe('UNKNOWN');
    });

    it('should handle case-sensitive patterns', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'UPPERCASE', path: '^SRC' },
        { name: 'LOWERCASE', path: '^src' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'SRC/upper.ts' }),
        makeSymbol({ path: 'src/lower.ts' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].role).toBe('UPPERCASE');
      expect(result[1].role).toBe('LOWERCASE');
    });

    it('should handle patterns with OR conditions', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'CONFIG', path: '(config|settings)' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'src/config/app.ts' }),
        makeSymbol({ path: 'src/settings/db.ts' }),
        makeSymbol({ path: 'src/other/file.ts' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].role).toBe('CONFIG');
      expect(result[1].role).toBe('CONFIG');
      expect(result[2].role).toBe('UNKNOWN');
    });

    it('should handle patterns matching entire path', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'EXACT', path: '^src/exact/match\\.ts$' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'src/exact/match.ts' }),
        makeSymbol({ path: 'src/exact/match.ts.backup' }),
        makeSymbol({ path: 'prefix/src/exact/match.ts' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].role).toBe('EXACT');
      expect(result[1].role).toBe('UNKNOWN');
      expect(result[2].role).toBe('UNKNOWN');
    });

    it('should handle patterns with character classes', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'TEST', path: '^tests?/.*\\.(spec|test)\\.ts$' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'test/unit.spec.ts' }),
        makeSymbol({ path: 'tests/integration.test.ts' }),
        makeSymbol({ path: 'tests/helper.ts' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].role).toBe('TEST');
      expect(result[1].role).toBe('TEST');
      expect(result[2].role).toBe('UNKNOWN');
    });

    it('should handle patterns with wildcards', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'NESTED', path: '^src/.*/nested/' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'src/foo/nested/file.ts' }),
        makeSymbol({ path: 'src/bar/baz/nested/file.ts' }),
        makeSymbol({ path: 'src/nested/file.ts' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].role).toBe('NESTED');
      expect(result[1].role).toBe('NESTED');
      expect(result[2].role).toBe('UNKNOWN');
    });

    it('should assign different roles to different symbols', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'PRESENTATION', path: '^src/presentation' },
        { name: 'DATA', path: '^src/data' },
        { name: 'DOMAIN', path: '^src/domain' },
        { name: 'INFRA', path: '^src/infra' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'src/presentation/controllers/user.ts', name: 'UserController' }),
        makeSymbol({ path: 'src/data/usecases/create-user.ts', name: 'CreateUser' }),
        makeSymbol({ path: 'src/domain/models/user.ts', name: 'User' }),
        makeSymbol({ path: 'src/infra/database/connection.ts', name: 'Connection' }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].role).toBe('PRESENTATION');
      expect(result[1].role).toBe('DATA');
      expect(result[2].role).toBe('DOMAIN');
      expect(result[3].role).toBe('INFRA');
    });

    it('should handle symbols with no dependencies', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'DOMAIN', path: '^src/domain' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'src/domain/value-object.ts', dependencies: [] }),
      ];

      const grammar = makeGrammar(roles);
      const result = sut.assign(symbols, grammar);

      expect(result[0].dependencies).toEqual([]);
      expect(result[0].role).toBe('DOMAIN');
    });

    it('should not mutate original symbols array', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'DOMAIN', path: '^src/domain' },
      ];

      const symbols: CodeSymbolModel[] = [
        makeSymbol({ path: 'src/domain/user.ts', role: 'UNKNOWN' }),
      ];

      const originalRole = symbols[0].role;
      const grammar = makeGrammar(roles);
      sut.assign(symbols, grammar);

      // Original array should not be mutated
      expect(symbols[0].role).toBe(originalRole);
    });

    it('should handle large number of symbols efficiently', () => {
      const roles: RoleDefinitionModel[] = [
        { name: 'DOMAIN', path: '^src/domain' },
      ];

      // Create 1000 symbols
      const symbols: CodeSymbolModel[] = Array.from({ length: 1000 }, (_, i) =>
        makeSymbol({ path: `src/domain/file${i}.ts`, name: `File${i}` })
      );

      const grammar = makeGrammar(roles);
      const start = performance.now();
      const result = sut.assign(symbols, grammar);
      const duration = performance.now() - start;

      expect(result).toHaveLength(1000);
      expect(result.every(s => s.role === 'DOMAIN')).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});

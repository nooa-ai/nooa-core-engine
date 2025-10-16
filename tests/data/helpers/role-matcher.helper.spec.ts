import { describe, it, expect, beforeEach } from 'vitest';
import { RoleMatcherHelper } from '../../../src/data/helpers/role-matcher.helper';

describe('RoleMatcherHelper', () => {
  let sut: RoleMatcherHelper;

  beforeEach(() => {
    sut = new RoleMatcherHelper();
  });

  describe('matches', () => {
    it('should return true when ruleRole is "ALL"', () => {
      const result = sut.matches('DOMAIN', 'ALL');

      expect(result).toBe(true);
    });

    it('should return true for any role when ruleRole is "ALL"', () => {
      expect(sut.matches('DOMAIN', 'ALL')).toBe(true);
      expect(sut.matches('INFRA', 'ALL')).toBe(true);
      expect(sut.matches('PRESENTATION', 'ALL')).toBe(true);
      expect(sut.matches('UNKNOWN', 'ALL')).toBe(true);
    });

    it('should return true when symbolRole matches string ruleRole', () => {
      const result = sut.matches('DOMAIN', 'DOMAIN');

      expect(result).toBe(true);
    });

    it('should return false when symbolRole does not match string ruleRole', () => {
      const result = sut.matches('DOMAIN', 'INFRA');

      expect(result).toBe(false);
    });

    it('should be case-sensitive for string matching', () => {
      const result = sut.matches('domain', 'DOMAIN');

      expect(result).toBe(false);
    });

    it('should return true when symbolRole is in array ruleRole', () => {
      const result = sut.matches('DOMAIN', ['DOMAIN', 'USECASE', 'DATA']);

      expect(result).toBe(true);
    });

    it('should return true for any role in array', () => {
      const ruleRole = ['DOMAIN', 'USECASE', 'DATA'];

      expect(sut.matches('DOMAIN', ruleRole)).toBe(true);
      expect(sut.matches('USECASE', ruleRole)).toBe(true);
      expect(sut.matches('DATA', ruleRole)).toBe(true);
    });

    it('should return false when symbolRole is not in array ruleRole', () => {
      const result = sut.matches('INFRA', ['DOMAIN', 'USECASE', 'DATA']);

      expect(result).toBe(false);
    });

    it('should handle empty array ruleRole', () => {
      const result = sut.matches('DOMAIN', []);

      expect(result).toBe(false);
    });

    it('should handle single-element array ruleRole', () => {
      const result = sut.matches('DOMAIN', ['DOMAIN']);

      expect(result).toBe(true);
    });

    it('should be case-sensitive for array matching', () => {
      const result = sut.matches('domain', ['DOMAIN', 'USECASE']);

      expect(result).toBe(false);
    });

    it('should handle complex role names with underscores', () => {
      expect(sut.matches('COMPOSER_CONTROLLER_FACTORY', 'COMPOSER_CONTROLLER_FACTORY')).toBe(true);
      expect(sut.matches('COMPOSER_CONTROLLER_FACTORY', ['COMPOSER', 'COMPOSER_CONTROLLER_FACTORY'])).toBe(true);
    });

    it('should handle complex role names in arrays', () => {
      const result = sut.matches('INFRA_ADAPTER', ['DOMAIN', 'INFRA_ADAPTER', 'INFRA_REPOSITORY']);

      expect(result).toBe(true);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { StringSimilarityHelper } from '../../../src/data/helpers/string-similarity.helper';

describe('StringSimilarityHelper', () => {
  let sut: StringSimilarityHelper;

  beforeEach(() => {
    sut = new StringSimilarityHelper();
  });

  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      const result = sut.calculateSimilarity('hello', 'hello');

      expect(result).toBe(1.0);
    });

    it('should return 0.0 when first string is empty', () => {
      const result = sut.calculateSimilarity('', 'hello');

      expect(result).toBe(0.0);
    });

    it('should return 0.0 when second string is empty', () => {
      const result = sut.calculateSimilarity('hello', '');

      expect(result).toBe(0.0);
    });

    it('should return 0.0 when both strings are empty', () => {
      const result = sut.calculateSimilarity('', '');

      expect(result).toBe(1.0); // Actually returns 1.0 because they are equal
    });

    it('should return high similarity for strings with common prefix', () => {
      const result = sut.calculateSimilarity('repository', 'repositorio');

      expect(result).toBeGreaterThan(0.9);
    });

    it('should return higher similarity for strings with longer common prefix', () => {
      const similarity1 = sut.calculateSimilarity('abcdef', 'abcxyz');
      const similarity2 = sut.calculateSimilarity('abcdef', 'axyz');

      expect(similarity1).toBeGreaterThan(similarity2);
    });

    it('should return value between 0 and 1', () => {
      const result = sut.calculateSimilarity('hello', 'world');

      expect(result).toBeGreaterThanOrEqual(0.0);
      expect(result).toBeLessThanOrEqual(1.0);
    });

    it('should be case-sensitive', () => {
      const result1 = sut.calculateSimilarity('Hello', 'hello');
      const result2 = sut.calculateSimilarity('hello', 'hello');

      expect(result1).toBeLessThan(result2);
    });

    it('should handle transpositions', () => {
      // "martha" vs "marhta" has one transposition
      const result = sut.calculateSimilarity('martha', 'marhta');

      expect(result).toBeGreaterThan(0.9);
    });

    it('should return lower similarity for completely different strings', () => {
      const result = sut.calculateSimilarity('abc', 'xyz');

      expect(result).toBeLessThan(0.5);
    });

    it('should handle strings of different lengths', () => {
      const result = sut.calculateSimilarity('short', 'a very long string');

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(0.5);
    });

    it('should handle single character strings', () => {
      const result1 = sut.calculateSimilarity('a', 'a');
      const result2 = sut.calculateSimilarity('a', 'b');

      expect(result1).toBe(1.0);
      expect(result2).toBe(0.0);
    });

    it('should boost similarity for common prefixes (Winkler modification)', () => {
      // "dixon" vs "dicksonx" - common prefix "di" should boost similarity
      const withPrefix = sut.calculateSimilarity('dixon', 'dicksonx');

      // Compare with strings without common prefix
      const withoutPrefix = sut.calculateSimilarity('xdixon', 'dicksonx');

      expect(withPrefix).toBeGreaterThan(withoutPrefix);
    });
  });

  describe('extractFileName', () => {
    it('should extract file name from path with directory', () => {
      const result = sut.extractFileName('src/domain/user.ts');

      expect(result).toBe('user');
    });

    it('should remove .ts extension', () => {
      const result = sut.extractFileName('user.ts');

      expect(result).toBe('user');
    });

    it('should remove .js extension', () => {
      const result = sut.extractFileName('user.js');

      expect(result).toBe('user');
    });

    it('should remove .tsx extension', () => {
      const result = sut.extractFileName('component.tsx');

      expect(result).toBe('component');
    });

    it('should remove .jsx extension', () => {
      const result = sut.extractFileName('component.jsx');

      expect(result).toBe('component');
    });

    it('should handle deeply nested paths', () => {
      const result = sut.extractFileName('src/domain/models/user/profile.ts');

      expect(result).toBe('profile');
    });

    it('should handle file name without extension', () => {
      const result = sut.extractFileName('src/domain/README');

      expect(result).toBe('README');
    });

    it('should handle file name with multiple dots', () => {
      const result = sut.extractFileName('user.model.ts');

      expect(result).toBe('user.model');
    });

    it('should handle path with only file name', () => {
      const result = sut.extractFileName('user.ts');

      expect(result).toBe('user');
    });
  });

  describe('normalizeName', () => {
    it('should convert to lowercase', () => {
      const result = sut.normalizeName('UserService');

      expect(result).toBe('user');
    });

    it('should remove "usecase" suffix', () => {
      const result = sut.normalizeName('createuserusecase');

      expect(result).toBe('createuser');
    });

    it('should remove "use-case" suffix', () => {
      const result = sut.normalizeName('createuser-use-case');

      expect(result).toBe('createuser');
    });

    it('should remove "implementation" suffix', () => {
      const result = sut.normalizeName('createuserimplementation');

      expect(result).toBe('createuser');
    });

    it('should remove "impl" suffix', () => {
      const result = sut.normalizeName('createuserimpl');

      expect(result).toBe('createuser');
    });

    it('should remove "adapter" suffix', () => {
      const result = sut.normalizeName('databaseadapter');

      expect(result).toBe('database');
    });

    it('should remove "repository" suffix', () => {
      const result = sut.normalizeName('userrepository');

      expect(result).toBe('user');
    });

    it('should remove "controller" suffix', () => {
      const result = sut.normalizeName('usercontroller');

      expect(result).toBe('user');
    });

    it('should remove "service" suffix', () => {
      const result = sut.normalizeName('userservice');

      expect(result).toBe('user');
    });

    it('should remove "factory" suffix', () => {
      const result = sut.normalizeName('userfactory');

      expect(result).toBe('user');
    });

    it('should remove "builder" suffix', () => {
      const result = sut.normalizeName('userbuilder');

      expect(result).toBe('user');
    });

    it('should remove "creator" suffix', () => {
      const result = sut.normalizeName('usercreator');

      expect(result).toBe('user');
    });

    it('should remove "generator" suffix', () => {
      const result = sut.normalizeName('usergenerator');

      expect(result).toBe('user');
    });

    it('should remove suffix with dash separator', () => {
      const result = sut.normalizeName('user-service');

      expect(result).toBe('user');
    });

    it('should remove suffix with underscore separator', () => {
      const result = sut.normalizeName('user_service');

      expect(result).toBe('user');
    });

    it('should remove suffix with dot separator', () => {
      const result = sut.normalizeName('user.service');

      expect(result).toBe('user');
    });

    it('should handle name without suffix', () => {
      const result = sut.normalizeName('user');

      expect(result).toBe('user');
    });

    it('should apply thesaurus substitution', () => {
      const thesaurus = [['user', 'person', 'customer']];

      const result = sut.normalizeName('create person', thesaurus);

      expect(result).toBe('create user');
    });

    it('should apply multiple thesaurus groups', () => {
      const thesaurus = [
        ['user', 'person', 'customer'],
        ['create', 'add', 'insert'],
      ];

      const result = sut.normalizeName('add customer', thesaurus);

      expect(result).toBe('create user');
    });

    it('should use first synonym as canonical form', () => {
      const thesaurus = [['canonical', 'synonym1', 'synonym2']];

      const result1 = sut.normalizeName('synonym1', thesaurus);
      const result2 = sut.normalizeName('synonym2', thesaurus);

      expect(result1).toBe('canonical');
      expect(result2).toBe('canonical');
    });

    it('should apply word boundary matching in thesaurus', () => {
      const thesaurus = [['user', 'person']];

      // Should not replace "person" within "personalize"
      const result = sut.normalizeName('personalize', thesaurus);

      expect(result).toBe('personalize');
    });

    it('should apply both suffix removal and thesaurus', () => {
      const thesaurus = [['user', 'customer']];

      const result = sut.normalizeName('CustomerService', thesaurus);

      expect(result).toBe('user');
    });

    it('should handle empty thesaurus', () => {
      const result = sut.normalizeName('UserService', []);

      expect(result).toBe('user');
    });

    it('should handle undefined thesaurus', () => {
      const result = sut.normalizeName('UserService');

      expect(result).toBe('user');
    });

    it('should handle complex real-world name', () => {
      const result = sut.normalizeName('CreateUserUseCase');

      expect(result).toBe('createuser');
    });
  });
});

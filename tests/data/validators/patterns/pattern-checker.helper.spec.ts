/**
 * Unit tests for PatternCheckerHelper
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PatternCheckerHelper } from '../../../../src/data/validators/patterns/pattern-checker.helper';

describe('PatternCheckerHelper', () => {
  let sut: PatternCheckerHelper;

  beforeEach(() => {
    sut = new PatternCheckerHelper();
  });

  describe('findForbiddenKeyword', () => {
    it('should find keyword when present in content', () => {
      const content = 'This code contains console.log("debug");';
      const keywords = ['console.log', 'debugger'];

      const result = sut.findForbiddenKeyword(content, keywords);

      expect(result).toBe('console.log');
    });

    it('should return null when no keywords are present', () => {
      const content = 'This is clean code without any forbidden keywords';
      const keywords = ['console.log', 'debugger'];

      const result = sut.findForbiddenKeyword(content, keywords);

      expect(result).toBeNull();
    });

    it('should find first matching keyword when multiple present', () => {
      const content = 'console.log("test"); debugger; alert("hi");';
      const keywords = ['console.log', 'debugger', 'alert'];

      const result = sut.findForbiddenKeyword(content, keywords);

      expect(result).toBe('console.log');
    });

    it('should return null for empty keywords array', () => {
      const content = 'Some content';
      const keywords: string[] = [];

      const result = sut.findForbiddenKeyword(content, keywords);

      expect(result).toBeNull();
    });

    it('should handle empty content', () => {
      const content = '';
      const keywords = ['console.log'];

      const result = sut.findForbiddenKeyword(content, keywords);

      expect(result).toBeNull();
    });

    it('should be case-sensitive', () => {
      const content = 'CONSOLE.LOG("test")';
      const keywords = ['console.log'];

      const result = sut.findForbiddenKeyword(content, keywords);

      expect(result).toBeNull();
    });

    it('should handle keywords with special characters', () => {
      const content = 'eval("malicious code")';
      const keywords = ['eval('];

      const result = sut.findForbiddenKeyword(content, keywords);

      expect(result).toBe('eval(');
    });

    it('should find keyword in multiline content', () => {
      const content = `
        function test() {
          console.log("debug");
          return true;
        }
      `;
      const keywords = ['console.log'];

      const result = sut.findForbiddenKeyword(content, keywords);

      expect(result).toBe('console.log');
    });

    it('should handle keywords that are substrings of others', () => {
      const content = 'This contains log but not console.log';
      const keywords = ['console.log', 'log'];

      const result = sut.findForbiddenKeyword(content, keywords);

      // Should find first keyword in the array that matches
      expect(result).toBe('console.log');
    });

    it('should handle very long content efficiently', () => {
      const content = 'a'.repeat(10000) + 'console.log' + 'b'.repeat(10000);
      const keywords = ['console.log'];

      const start = performance.now();
      const result = sut.findForbiddenKeyword(content, keywords);
      const duration = performance.now() - start;

      expect(result).toBe('console.log');
      expect(duration).toBeLessThan(50); // Should be fast
    });

    it('should handle many keywords efficiently', () => {
      const content = 'Some code with debugger;';
      const keywords = Array(100).fill('unused').concat(['debugger']);

      const start = performance.now();
      const result = sut.findForbiddenKeyword(content, keywords);
      const duration = performance.now() - start;

      expect(result).toBe('debugger');
      expect(duration).toBeLessThan(50);
    });
  });

  describe('findForbiddenPattern', () => {
    it('should find pattern when it matches content', () => {
      const content = 'const x = 123;';
      const patterns = ['const\\s+\\w+', 'var\\s+\\w+'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('const\\s+\\w+');
    });

    it('should return null when no patterns match', () => {
      const content = 'This is clean code';
      const patterns = ['eval\\(', 'Function\\('];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBeNull();
    });

    it('should find first matching pattern when multiple match', () => {
      const content = 'const x = 123; var y = 456;';
      const patterns = ['const\\s+', 'var\\s+'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('const\\s+');
    });

    it('should return null for empty patterns array', () => {
      const content = 'Some content';
      const patterns: string[] = [];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBeNull();
    });

    it('should handle empty content', () => {
      const content = '';
      const patterns = ['test'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBeNull();
    });

    it('should handle invalid regex patterns gracefully', () => {
      const content = 'This has valid123 word';
      const patterns = ['[invalid(regex', 'valid\\w+'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('valid\\w+');
    });

    it('should skip all invalid patterns without throwing', () => {
      const content = 'Some content';
      const patterns = ['[invalid', '(broken', '{bad'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBeNull();
    });

    it('should handle complex regex patterns', () => {
      const content = 'email@example.com';
      const patterns = ['\\w+@\\w+\\.\\w+'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('\\w+@\\w+\\.\\w+');
    });

    it('should handle patterns with anchors', () => {
      const content = 'function test() {}';
      const patterns = ['^function\\s+\\w+'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('^function\\s+\\w+');
    });

    it('should handle patterns with character classes', () => {
      const content = 'x = 123;';
      const patterns = ['[a-z]\\s*=\\s*[0-9]+'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('[a-z]\\s*=\\s*[0-9]+');
    });

    it('should handle patterns with quantifiers', () => {
      const content = 'aaaaa';
      const patterns = ['a{5}', 'b+'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('a{5}');
    });

    it('should handle patterns with lookahead/lookbehind', () => {
      const content = 'password123';
      const patterns = ['password(?=\\d+)'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('password(?=\\d+)');
    });

    it('should be case-sensitive by default', () => {
      const content = 'CONST x = 1;';
      const patterns = ['const'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBeNull();
    });

    it('should handle multiline content', () => {
      const content = `
        line 1
        line 2
        line 3
      `;
      const patterns = ['line\\s+2'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('line\\s+2');
    });

    it('should handle patterns with word boundaries', () => {
      const content = 'test testing tester';
      const patterns = ['\\btest\\b'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('\\btest\\b');
    });

    it('should handle patterns with alternation', () => {
      const content = 'using var keyword';
      const patterns = ['(const|let|var)'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('(const|let|var)');
    });

    it('should handle very long content efficiently', () => {
      const content = 'a'.repeat(10000) + 'FORBIDDEN' + 'b'.repeat(10000);
      const patterns = ['FORBIDDEN'];

      const start = performance.now();
      const result = sut.findForbiddenPattern(content, patterns);
      const duration = performance.now() - start;

      expect(result).toBe('FORBIDDEN');
      expect(duration).toBeLessThan(50);
    });

    it('should handle many patterns efficiently', () => {
      const content = 'Some code with pattern';
      const patterns = Array(100).fill('unused\\d+').concat(['pattern']);

      const start = performance.now();
      const result = sut.findForbiddenPattern(content, patterns);
      const duration = performance.now() - start;

      expect(result).toBe('pattern');
      expect(duration).toBeLessThan(100);
    });

    it('should handle patterns with escaped special characters', () => {
      const content = 'price: $100';
      const patterns = ['\\$\\d+'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('\\$\\d+');
    });

    it('should handle patterns matching entire content', () => {
      const content = 'complete match';
      const patterns = ['^complete match$'];

      const result = sut.findForbiddenPattern(content, patterns);

      expect(result).toBe('^complete match$');
    });
  });
});

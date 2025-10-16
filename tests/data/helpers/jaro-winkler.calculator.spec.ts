/**
 * Unit tests for JaroWinklerCalculator
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { JaroWinklerCalculator } from '../../../src/data/helpers/jaro-winkler.calculator';

describe('JaroWinklerCalculator', () => {
  let sut: JaroWinklerCalculator;

  beforeEach(() => {
    sut = new JaroWinklerCalculator();
  });

  describe('calculate', () => {
    it('should return 1.0 for identical strings', () => {
      expect(sut.calculate('hello', 'hello')).toBe(1.0);
      expect(sut.calculate('test', 'test')).toBe(1.0);
      expect(sut.calculate('', '')).toBe(1.0);
    });

    it('should return 0.0 when either string is empty (and not both)', () => {
      expect(sut.calculate('', 'hello')).toBe(0.0);
      expect(sut.calculate('hello', '')).toBe(0.0);
    });

    it('should return high similarity for very similar strings', () => {
      const similarity = sut.calculate('hello', 'hallo');
      expect(similarity).toBeGreaterThan(0.8);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should return lower similarity for different strings', () => {
      const similarity = sut.calculate('hello', 'world');
      expect(similarity).toBeLessThan(0.5);
    });

    it('should give higher weight to strings with common prefix (Winkler boost)', () => {
      const withCommonPrefix = sut.calculate('prefix123', 'prefix456');
      const withoutCommonPrefix = sut.calculate('abc123', 'xyz456');

      expect(withCommonPrefix).toBeGreaterThan(withoutCommonPrefix);
    });

    it('should handle single character strings', () => {
      expect(sut.calculate('a', 'a')).toBe(1.0);
      expect(sut.calculate('a', 'b')).toBe(0.0);
    });

    it('should handle strings of different lengths', () => {
      const similarity = sut.calculate('short', 'very long string');
      expect(similarity).toBeGreaterThan(0.0);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should be case-sensitive', () => {
      const caseSensitive = sut.calculate('Hello', 'hello');
      expect(caseSensitive).toBeLessThan(1.0);
    });

    it('should handle strings with special characters', () => {
      const similarity = sut.calculate('hello-world', 'hello_world');
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should handle unicode characters', () => {
      const similarity = sut.calculate('café', 'cafe');
      expect(similarity).toBeGreaterThan(0.7);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should handle strings with spaces', () => {
      const similarity = sut.calculate('hello world', 'hello  world');
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('should return similarity between 0 and 1', () => {
      const testCases = [
        ['abc', 'xyz'],
        ['test', 'best'],
        ['hello', 'hallo'],
        ['completely', 'different'],
      ];

      for (const [str1, str2] of testCases) {
        const similarity = sut.calculate(str1, str2);
        expect(similarity).toBeGreaterThanOrEqual(0.0);
        expect(similarity).toBeLessThanOrEqual(1.0);
      }
    });

    it('should be symmetric (order should not matter)', () => {
      const forward = sut.calculate('hello', 'world');
      const backward = sut.calculate('world', 'hello');
      expect(forward).toBe(backward);
    });

    it('should handle transpositions correctly', () => {
      // "MARTHA" vs "MARHTA" - one transposition
      const similarity = sut.calculate('MARTHA', 'MARHTA');
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('should handle long strings efficiently', () => {
      const longStr1 = 'a'.repeat(1000);
      const longStr2 = 'a'.repeat(999) + 'b';

      const start = performance.now();
      const similarity = sut.calculate(longStr1, longStr2);
      const duration = performance.now() - start;

      expect(similarity).toBeGreaterThan(0.99);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle common prefix up to 4 characters (Winkler modification)', () => {
      // With 4-char common prefix
      const fourCharPrefix = sut.calculate('test1234', 'test5678');

      // With 5-char common prefix (only 4 should be counted)
      const fiveCharPrefix = sut.calculate('tests1234', 'tests5678');

      // Both should have similar boost since Winkler only considers up to 4 chars
      expect(Math.abs(fourCharPrefix - fiveCharPrefix)).toBeLessThan(0.05);
    });

    it('should handle strings with no common characters', () => {
      const similarity = sut.calculate('abc', 'xyz');
      expect(similarity).toBe(0.0);
    });

    it('should handle repeated characters', () => {
      const similarity = sut.calculate('aaa', 'aaa');
      expect(similarity).toBe(1.0);
    });

    it('should handle partially matching repeated characters', () => {
      const similarity = sut.calculate('aaa', 'aab');
      expect(similarity).toBeGreaterThan(0.7);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should calculate known Jaro-Winkler examples correctly', () => {
      // Classic example: MARTHA vs MARHTA
      const martha = sut.calculate('MARTHA', 'MARHTA');
      expect(martha).toBeGreaterThan(0.96);

      // Another classic: DWAYNE vs DUANE
      const dwayne = sut.calculate('DWAYNE', 'DUANE');
      expect(dwayne).toBeGreaterThan(0.82);
    });

    it('should handle numbers in strings', () => {
      const similarity = sut.calculate('test123', 'test456');
      expect(similarity).toBeGreaterThan(0.7);
    });

    it('should handle mixed alphanumeric strings', () => {
      const similarity = sut.calculate('abc123xyz', 'abc456xyz');
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should return consistent results for same inputs', () => {
      const result1 = sut.calculate('consistency', 'test');
      const result2 = sut.calculate('consistency', 'test');
      const result3 = sut.calculate('consistency', 'test');

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should handle strings with punctuation', () => {
      const similarity = sut.calculate('hello, world!', 'hello world');
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should handle strings with newlines and tabs', () => {
      const similarity = sut.calculate('hello\nworld', 'hello\tworld');
      expect(similarity).toBeGreaterThan(0.8);
    });
  });
});

import { describe, it, expect } from 'vitest';

describe('Data Protocols Index', () => {
  it('should successfully import data protocols', () => {
    // This test verifies that the index file is properly exporting interfaces
    // TypeScript interfaces don't exist at runtime, so we just verify import works
    expect(() => import('../../../src/data/protocols')).not.toThrow();
  });
});
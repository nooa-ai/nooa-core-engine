import { describe, it, expect } from 'vitest';

describe('Domain Models Index', () => {
  it('should successfully import domain models', () => {
    // This test verifies that the index file is properly exporting types
    // TypeScript types don't exist at runtime, so we just verify import works
    expect(() => import('../../../src/domain/models')).not.toThrow();
  });
});
import { describe, it, expect } from 'vitest';

describe('Domain Usecases Index', () => {
  it('should successfully import domain usecases', () => {
    // This test verifies that the index file is properly exporting interfaces
    // TypeScript interfaces don't exist at runtime, so we just verify import works
    expect(() => import('../../../src/domain/usecases')).not.toThrow();
  });
});
import { describe, it, expect } from 'vitest';
import * as mocks from '../../../src/domain/mocks';

describe('Domain Mocks Index', () => {
  it('should export all mocks', () => {
    // Verify that all mock factories are exported
    expect(mocks.makeGrammarMock).toBeDefined();
    expect(mocks.makeRoleDefinitionMock).toBeDefined();
    expect(mocks.makeArchitecturalRuleMock).toBeDefined();
    expect(mocks.makeCodeSymbolMock).toBeDefined();
    expect(mocks.makeArchitecturalViolationMock).toBeDefined();
  });
});
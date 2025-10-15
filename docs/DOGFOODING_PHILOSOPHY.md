# Dogfooding Philosophy: Using the Grammar to Build the Validator

## The Golden Rule

> **"Vamos usar a gramática para construir o validador da gramática."**

This is not just a clever idea—it's the **foundational philosophy** of the Nooa Core Engine project. The tool that validates architectural rules must itself be a **dogmatic, perfect example** of the architecture it enforces.

## What is Dogfooding?

**Dogfooding** (eating your own dog food) is the practice of using your own product during development. In the context of Nooa:

- The **Nooa Core Engine** validates TypeScript projects against architectural grammars
- The **Nooa Core Engine itself** is a TypeScript project
- Therefore, **Nooa must validate Nooa**

This creates a powerful feedback loop where:
1. We define Clean Architecture rules in `nooa.grammar.yaml`
2. We implement features following those rules
3. We run Nooa against itself to verify compliance
4. Any violation indicates either a rule problem or code problem
5. We fix and iterate

## Why This Matters

### 1. **Credibility**

If Nooa cannot validate itself successfully, why should anyone trust it to validate their code?

```bash
npm start .
# ✅ No architectural violations found!
```

This single green checkmark is **the most important test** of the entire project.

### 2. **Immediate Feedback**

During development, every change is immediately tested:

```bash
# After implementing circular dependency detection
npm run build && npm start .

# After implementing required dependencies
npm run build && npm start .

# After implementing naming patterns
npm run build && npm start .
```

If Nooa reports violations in its own code, we know **immediately** that either:
- The implementation has a bug
- The grammar is too strict/incorrect
- The architecture has degraded

### 3. **Living Documentation**

The Nooa codebase serves as:
- ✅ **Reference implementation** of Clean Architecture
- ✅ **Example** of how to structure projects
- ✅ **Proof** that the rules are not just theoretical
- ✅ **Template** for other projects

Every file in `src/` demonstrates the pattern it will eventually validate.

### 4. **Quality Assurance**

Self-validation catches issues that traditional tests might miss:

| Traditional Testing | Dogfooding |
|-------------------|-----------|
| Tests specific behaviors | Tests architectural integrity |
| Can miss structural issues | Catches all dependency violations |
| Requires writing test cases | Automatic with every run |
| Tests what you thought to test | Tests what the grammar defines |

## The Development Cycle

### Phase 1: Define the Grammar

```yaml
# nooa.grammar.yaml
rules:
  - name: "Domain-Independence"
    severity: error
    from:
      role: [NOUN, VERB_CONTRACT]
    to:
      role: [VERB_IMPLEMENTATION, ADVERB_CONCRETE]
    rule: "forbidden"
```

This rule **must** be followed by our own code.

### Phase 2: Implement Following the Grammar

```typescript
// src/domain/usecases/analyze-codebase.ts
// ✅ This file is in VERB_CONTRACT role
// ✅ It only imports from src/domain/models (NOUN role)
// ✅ It has NO imports from src/data or src/infra
import { ArchitecturalViolationModel } from '../models';

export interface IAnalyzeCodebase {
  analyze(params: IAnalyzeCodebase.Params): Promise<IAnalyzeCodebase.Result>;
}
```

### Phase 3: Validate

```bash
npm start .
```

If violations appear, we have **instant feedback** about where we broke the architecture.

### Phase 4: Fix and Iterate

```
❌ Found 1 violation:
  Domain-Independence: src/domain/usecases/analyze.ts
  cannot depend on src/data/protocols/parser.ts

# Fix: Move import to use case implementation in src/data
# Re-run: npm start .
# ✅ No violations!
```

## Self-Validation Checkpoints

Throughout development, we validated continuously:

### Checkpoint 1: Initial Structure
```bash
npm start .
# ✅ Validates: Basic layer separation (Domain, Data, Infra)
```

### Checkpoint 2: After Circular Detection
```bash
npm start .
# ✅ Validates: No circular dependencies in our own code
# ✅ Validates: New feature doesn't break existing rules
```

### Checkpoint 3: After Required Dependencies
```bash
npm start .
# ✅ Validates: Use cases implement contracts
# ✅ Validates: Adapters implement protocols
```

### Checkpoint 4: After Naming Patterns
```bash
npm start .
# ✅ Validates: Files follow naming conventions
# ✅ Validates: Complete type safety
```

### Final Checkpoint: Production Ready
```bash
npm run build && npm start .
# ✅ Compiles without errors
# ✅ Zero architectural violations
# ✅ Ready for release
```

## The Virtuous Cycle

```
┌─────────────────────────────────────────────┐
│  Write grammar rule                         │
│  (e.g., "Domain cannot depend on Infra")    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Implement feature following the rule       │
│  (e.g., Domain uses only interfaces)        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Run Nooa on itself                         │
│  npm start .                                │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
  ✅ Pass               ❌ Fail
  Continue              │
  Development           ▼
                  Fix violation
                        │
                        └─────┐
                              │
                    ┌─────────┘
                    │
                    ▼
              Grammar too strict?
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
      Refine               Architecture
      grammar               broken?
         │                     │
         │                     ▼
         │                Fix code
         │                     │
         └─────────┬───────────┘
                   │
                   ▼
          Run again until ✅
```

## Concrete Examples

### Example 1: Domain Independence

**Grammar says:**
```yaml
- name: "Domain-Independence"
  from:
    role: [NOUN, VERB_CONTRACT]
  to:
    role: [ADVERB_CONCRETE]
  rule: "forbidden"
```

**Our code proves:**
```typescript
// src/domain/models/architectural-rule.model.ts
// ✅ ZERO imports from src/infra
// ✅ ZERO imports from src/data
// ✅ Pure TypeScript types only

export type ArchitecturalRuleModel = {
  name: string;
  severity: RuleSeverity;
  // ...
};
```

**Validation:**
```bash
npm start .
# Scans src/domain/models/architectural-rule.model.ts
# Checks all imports
# ✅ No forbidden dependencies found
```

### Example 2: Dependency Inversion

**Grammar says:**
```yaml
- name: "Data-Dependency-Inversion"
  from:
    role: VERB_IMPLEMENTATION
  to:
    role: ADVERB_CONCRETE
  rule: "forbidden"
```

**Our code proves:**
```typescript
// src/data/usecases/analyze-codebase.usecase.ts
// ✅ Depends on ICodeParser (protocol)
// ✅ Does NOT depend on TSMorphParserAdapter (concrete)

import { ICodeParser } from '../protocols';
// NOT: import { TSMorphParserAdapter } from '../../infra';

constructor(
  private readonly codeParser: ICodeParser  // ✅ Interface
) {}
```

**Validation:**
```bash
npm start .
# Scans src/data/usecases/analyze-codebase.usecase.ts
# Checks all imports
# ✅ No concrete infrastructure dependencies
```

### Example 3: Required Contracts

**Grammar says:**
```yaml
- name: "Use-Case-Must-Implement-Contract"
  from:
    role: VERB_IMPLEMENTATION
  to:
    role: VERB_CONTRACT
  rule: "required"
```

**Our code proves:**
```typescript
// src/data/usecases/analyze-codebase.usecase.ts
// ✅ Imports and implements IAnalyzeCodebase

import { IAnalyzeCodebase } from '../../domain/usecases';

export class AnalyzeCodebaseUseCase implements IAnalyzeCodebase {
  // ✅ Has required dependency on domain contract
}
```

**Validation:**
```bash
npm start .
# Checks: Does analyze-codebase.usecase.ts import from domain/usecases?
# ✅ Yes - IAnalyzeCodebase found
# ✅ Required dependency satisfied
```

## The Philosophical Foundation

### Principle 1: Trust Through Transparency

**If we can't follow our own rules, why should you?**

By validating ourselves, we demonstrate:
- The rules are **achievable**
- The architecture is **practical**
- The tool is **reliable**

### Principle 2: Constraints Breed Excellence

**The grammar constraints forced better design decisions.**

When Nooa reports:
```
❌ src/domain/models cannot depend on src/infra
```

We don't disable the rule—we **refactor the code** to be cleaner.

### Principle 3: The Tool Improves the Tool

**Building Nooa made Nooa better.**

While implementing features, dogfooding revealed:
- Edge cases in the grammar syntax
- Ambiguities in rule definitions
- Performance bottlenecks
- Missing features

Each self-validation improved both:
- The **code** (cleaner architecture)
- The **tool** (better validation)

## Best Practices for Users

When using Nooa for your own projects, follow the same philosophy:

### 1. Start with Self-Validation

```bash
# Create your grammar
vim nooa.grammar.yaml

# Validate your project
npm start .

# Fix violations
# Repeat
```

### 2. Make Grammar Part of CI/CD

```yaml
# .github/workflows/validate-architecture.yml
- name: Validate Architecture
  run: |
    npm install -g nooa-core-engine
    nooa .
```

### 3. Treat Violations as Bugs

```
❌ Architectural violation = 🐛 Bug
```

Don't ignore them. Don't disable rules. **Fix the architecture.**

### 4. Update Grammar as You Learn

```yaml
# Version 1
rules:
  - name: "Basic-Separation"
    # ...

# Version 2 (after learning)
rules:
  - name: "Strict-Layer-Isolation"
    # More refined rules
```

## Conclusion

The **dogfooding philosophy** is not optional for Nooa—it's **essential**.

Every line of code in this project:
- ✅ Follows Clean Architecture
- ✅ Passes its own validation
- ✅ Serves as an example
- ✅ Proves the concept works

When you see:

```bash
npm start .
✅ No architectural violations found!
```

You're not just seeing a passing test. You're seeing:
- **Proof** that Clean Architecture can be formalized
- **Evidence** that architectural rules can be automated
- **Validation** that the tool itself is well-architected
- **Confidence** that Nooa can help your project

**The grammar builds the validator. The validator validates itself. The cycle is complete.**

---

## References

For implementation details of self-validation:
- `nooa.grammar.yaml` - The grammar that validates Nooa
- `docs/V1.1_FEATURES.md` - All features used in self-validation
- `docs/CLEAN_ARCHITECTURE_GRAMMAR_ANALYSIS.md` - Theoretical foundation

To see it in action:
```bash
npm start .
```

To understand what it validates:
```bash
npm start . 2>&1 | grep -i "analyzing"
```

**Every commit should pass self-validation. No exceptions.**

# 🏗️ Nooa Architectural Code Review Process

## Overview

Nooa uses **automated architectural code review** powered by Claude Code to ensure every PR follows Clean Architecture principles. The review process validates code against Nooa's grammar rules **before** human review.

---

## How It Works

### Workflow Trigger

```yaml
on:
  pull_request:
    types: [opened, synchronize]
```

Every PR automatically triggers:
1. **Nooa Validation** - Runs architectural analysis
2. **Claude Review** - AI analyzes violations and code patterns
3. **PR Comment** - Structured feedback posted

---

## Review Process

### Step 1: Automated Nooa Validation

```bash
npm ci
npm run build
npm start . > pr-validation-report.txt
```

**Extracts**:
- Total violations
- Errors (blocking)
- Warnings (informational)

### Step 2: Claude Architectural Analysis

Claude reads:
1. PR diff (`gh pr diff`)
2. Nooa validation report
3. Grammar rules (`nooa.grammar.yaml`)
4. Architecture docs:
   - `CLEAN_ARCHITECTURE_GRAMMAR_ANALYSIS.md`
   - `CLEAN_ARCHITECTURE_TEST_GRAMMAR_ANALYSIS.md`

### Step 3: Structured Review

Claude evaluates against **3-tier checklist**:

#### 🔴 CRITICAL (Blocking)

Must be fixed before merge:

- [ ] **Dependency Direction**: Domain ← Data ← Infra ← Presentation
- [ ] **DIP Compliance**: Concrete implementations injected via protocols
- [ ] **Layer Isolation**: Files only import from allowed layers
- [ ] **Naming Conventions**: `.usecase.ts`, `.adapter.ts`, `.controller.ts`
- [ ] **File Size**: <200 LOC (error threshold)
- [ ] **Nooa Errors**: 0 architectural errors

#### 🟡 IMPORTANT (Should Fix)

Strongly recommended:

- [ ] **Single Responsibility**: Each file has one clear purpose
- [ ] **Test Coverage**: New files have tests
- [ ] **ISP Compliance**: Interfaces are small (1-2 methods preferred)
- [ ] **God Objects**: Classes have <10 public methods
- [ ] **Extract Class**: Large files split into helpers/validators

#### 🟢 NICE TO HAVE

Quality improvements:

- [ ] **Documentation**: Complex files have JSDoc
- [ ] **AI NOTE Comments**: Grammar rules include explanations
- [ ] **Performance**: Optimization opportunities identified

---

## Anti-Patterns vs Good Patterns

### ❌ Anti-Patterns (REJECT)

#### 1. Use Case Importing Concrete Infrastructure

```typescript
// ❌ WRONG: Violates DIP
import { TsMorphParser } from '@/infra/parsers/ts-morph-parser.adapter'

class AnalyzeCodebaseUseCase {
  constructor() {
    this.parser = new TsMorphParser() // Concrete dependency!
  }
}
```

**Rule violated**: `Data-Dependency-Inversion`

#### 2. Controller with Business Logic

```typescript
// ❌ WRONG: Business logic in presentation layer
class CliController {
  handle(args: string[]) {
    // Business logic should be in use case!
    const total = items.reduce((sum, item) => sum + item.price, 0)
    const discount = total > 100 ? total * 0.1 : 0
    return total - discount
  }
}
```

**Rule violated**: `No-Business-Logic-In-Controllers`

#### 3. Domain Importing Data Layer

```typescript
// ❌ WRONG: Dependency arrow pointing outward
// In src/domain/models/violation.model.ts
import { SomeUseCase } from '@/data/usecases'
```

**Rule violated**: `Domain-Independence`

#### 4. God Object

```typescript
// ❌ WRONG: Too many responsibilities (260 LOC)
class AnalyzeCodebaseUseCase {
  // 15 methods, 8 responsibilities mixed
  analyze() { ... }
  validateNaming() { ... }
  validateDependencies() { ... }
  validateHygiene() { ... }
  buildFileCache() { ... }
  assignRoles() { ... }
  // ... etc
}
```

**Rule violated**: `File-Size-Error`, `No-God-Objects`

---

### ✅ Good Patterns (APPROVE)

#### 1. Dependency Inversion

```typescript
// ✅ CORRECT: Use case depends on protocol
class AnalyzeCodebaseUseCase {
  constructor(
    private readonly parser: ICodeParser,  // Protocol, not concrete
    private readonly repo: IGrammarRepository
  ) {}
}
```

**Follows**: `Data-Dependency-Inversion`

#### 2. Thin Controller

```typescript
// ✅ CORRECT: Controller only orchestrates
class CliController {
  constructor(
    private readonly analyzeCodebase: IAnalyzeCodebase
  ) {}

  async handle(params: CliParams) {
    // No business logic - just orchestration
    return await this.analyzeCodebase.analyze({
      projectPath: params.path
    })
  }
}
```

**Follows**: `Presentation-Isolation`

#### 3. Extract Class Pattern

```typescript
// ✅ CORRECT: Helpers with single responsibility

// File: file-cache-builder.helper.ts (46 LOC)
class FileCacheBuilderHelper {
  build(symbols: CodeSymbolModel[], projectPath: string) {
    // Only builds file cache, nothing else
  }
}

// File: role-assignment.helper.ts (40 LOC)
class RoleAssignmentHelper {
  assign(symbols: CodeSymbolModel[], grammar: GrammarModel) {
    // Only assigns roles, nothing else
  }
}
```

**Follows**: `File-Size-Warning`, SRP

#### 4. Interface Segregation

```typescript
// ✅ CORRECT: Small, focused interfaces (1-2 methods)
interface IFileReader {
  readFileSync(path: string, encoding: string): string
}

interface IFileExistenceChecker {
  existsSync(path: string): boolean
}

// ❌ WRONG: Fat interface mixing concerns
interface IFileSystem {
  readFileSync(path: string): string
  writeFileSync(path: string, data: string): void
  existsSync(path: string): boolean
  deleteSync(path: string): void
  // ... 10 more methods
}
```

**Follows**: ISP, prevents thrashing

---

## Review Comment Format

Claude posts structured feedback:

```markdown
## 🏗️ Nooa Architectural Review

### Validation Status
- Errors: 0 ✅
- Warnings: 2
- Total Violations: 2

### Architecture Compliance

**✅ Approved**:
- Correct dependency direction (Domain ← Data)
- DIP compliance: All concrete implementations injected via protocols
- Proper naming conventions (.helper.ts, .usecase.ts)
- Files under 200 LOC
- Extract Class pattern applied successfully

**⚠️ Suggestions**:
- Consider adding tests for new helpers (file-cache-builder.helper.ts)
- JSDoc missing for FileCacheBuilderHelper class

**🔴 Required Changes**:
None - PR meets architectural standards

### Code Quality

**Dependency Direction**: ✅
- Use case correctly depends on IFileReader protocol
- No imports from outer layers detected

**Layer Isolation**: ✅
- Helpers only import domain models and protocols
- No circular dependencies

**File Sizes**: ✅
- file-cache-builder.helper.ts: 46 LOC
- role-assignment.helper.ts: 40 LOC
- analyze-codebase.usecase.ts: 195 LOC (reduced from 260)

**Naming Conventions**: ✅
- All files follow pattern conventions
- Helper suffix used correctly

**Test Coverage**: 🟡
- New helpers lack unit tests
- Recommend adding tests/data/helpers/*.spec.ts

### Clean Architecture Grammar Notes

This PR successfully applies **Extract Class pattern** following Nooa's grammatical principles:

- **VERB (Use Case)** reduced to pure orchestration (195 LOC)
- **ADVERB Helpers** extracted with single responsibilities:
  - FileCacheBuilderHelper: Caching concern (46 LOC)
  - RoleAssignmentHelper: Role mapping concern (40 LOC)
- Maintains **dependency arrows**: Helpers → Protocols → Domain
- No "run-on sentences" (God Objects) detected

**Linguistic metaphor**: Use case went from "paragraph" (260 LOC) to "sentence" (195 LOC) by delegating clauses to helpers.

---
🤖 Powered by Nooa Architectural Validation
```

---

## Blocking Criteria

PR is **blocked** if:

1. **Nooa errors > 0** - Architectural violations detected
2. **Dependency direction violated** - Wrong layer dependencies
3. **File size >200 LOC** - God Object detected
4. **Missing required dependencies** - Use case doesn't implement contract

PR can merge with **warnings** if:
- Warnings are explained in PR description
- Technical debt issue created
- Doesn't introduce new errors

---

## Grammar Evolution Reviews

When reviewing **learning insight PRs** (grammar evolution):

### Additional Checks

1. **Rule Format**:
   ```yaml
   - name: "Rule-Name"
     severity: error|warning|info
     comment: "AI NOTE: [Problem] - [Consequences]. REFACTOR: [Fix]. EXAMPLE: [Code]. BENEFIT: [Why]"
     from: { role: [...] }
     to: { role: [...] }
     rule: "rule_type"
   ```

2. **AI NOTE Structure**:
   - Must include: Problem description
   - Must include: REFACTOR section
   - Must include: EXAMPLE section (wrong vs correct)
   - Must include: BENEFIT section

3. **Evidence**:
   - Frequency >5 occurrences
   - Confidence score >0.8
   - References learning insight issue

4. **Dogfooding**:
   - `npm start .` must pass with 0 errors after adding rule
   - If Nooa can't follow its own rule, reject

---

## Developer Guidelines

### Before Submitting PR

```bash
# Run Nooa locally
npm run build
npm start .

# Fix any errors
# Warnings are OK but explain in PR description

# Run tests
npm test
```

### PR Description Template

```markdown
## Summary
[What does this PR do?]

## Architecture Notes
- Layer: [Domain/Data/Infra/Presentation/Validation/Main]
- Patterns used: [e.g., Extract Class, DIP, ISP]
- Rules followed: [Reference grammar rules]

## Nooa Validation
- Errors: 0 ✅
- Warnings: [count] - [explanation if any]

## Test Coverage
- [X] Unit tests added
- [ ] Integration tests needed (follow-up: #issue)

## Checklist
- [X] Files follow naming conventions
- [X] Files under 200 LOC
- [X] No dependency violations
- [X] Proper DIP compliance
```

---

## Examples

### Example 1: Refactoring PR (Approved)

**PR #5**: Extract helpers from analyze-codebase use case

**Review**:
- ✅ Errors: 0 (was 1)
- ✅ Use case reduced: 260 → 195 LOC
- ✅ Helpers extracted with SRP
- ✅ DIP maintained
- 🟡 Missing tests (non-blocking)

**Result**: APPROVED ✅

### Example 2: Feature PR (Changes Requested)

**Hypothetical PR**: Add validation layer

**Review**:
- 🔴 Errors: 2
  - Controller imports validator directly (should use IValidation)
  - Validator imports use case (should only import domain)
- ✅ Naming conventions correct
- ✅ File sizes OK

**Result**: CHANGES REQUESTED 🔴

### Example 3: Grammar Evolution PR (Approved)

**Hypothetical PR**: Add Use-Case-Size-Strict rule

**Review**:
- ✅ Rule format correct
- ✅ AI NOTE includes all sections
- ✅ Evidence: 8 occurrences, confidence 0.92
- ✅ Dogfooding passes (0 errors)
- ✅ CHANGELOG updated

**Result**: APPROVED ✅

---

## Metrics Tracked

Every review contributes to learning:

```json
{
  "pr": 5,
  "architecturalErrors": 0,
  "warnings": 2,
  "reviewTime": "653ms",
  "patternsDetected": ["Extract Class", "DIP"],
  "violationsFixed": 1,
  "approved": true
}
```

Data flows to learning discovery for pattern analysis.

---

## FAQ

**Q: What if Claude review is wrong?**
A: Human reviewers have final say. Comment `@claude your feedback on [X] seems incorrect because [Y]` and Claude will re-analyze.

**Q: Can I bypass the review?**
A: No - Nooa validation is mandatory. If you believe a rule is wrong, create a learning insight issue to discuss changing the rule.

**Q: How strict is the review?**
A: **Errors are blocking**. Warnings are informational and can merge with explanation.

**Q: What about legacy code?**
A: New code must follow rules. Legacy code violations should have technical debt issues. Use `// @nooa-ignore` sparingly with justification.

---

## References

- [Continuous Learning](./CONTINUOUS_LEARNING.md)
- [Clean Architecture Grammar](./CLEAN_ARCHITECTURE_GRAMMAR_ANALYSIS.md)
- [Test Grammar](./CLEAN_ARCHITECTURE_TEST_GRAMMAR_ANALYSIS.md)
- [Nooa Grammar](../nooa.grammar.yaml)

---

**🏗️ Architectural code review ensures every PR strengthens the grammar, never weakens it.**

---
name: 🧠 Learning Insight
about: Architectural pattern discovered by Nooa's continuous learning system
title: '🧠 Learning Insight: [Pattern Name]'
labels: 'learning-insight'
assignees: ''
---

<!--
This issue was automatically created by Nooa's Learning Discovery workflow.
It represents a recurring architectural pattern detected through violation clustering.
-->

## Pattern Description

**Name**: [e.g., "God Use Cases", "Missing Test Coverage", "Validation in Controllers"]

**Type**: [e.g., `file_size_violation`, `missing_tests`, `dependency_violation`, `naming_pattern`]

**Discovered**: [Date]

---

## Evidence

**Frequency**: [Number] occurrences

**Confidence Score**: [0.0-1.0]

**Affected Files**:
```
src/data/usecases/analyze-codebase.usecase.ts (260 LOC)
src/data/validators/code-pattern.validator.ts (168 LOC)
src/presentation/controllers/cli.controller.ts (128 LOC)
[... other files]
```

**Affected Layers**:
- [ ] Domain (`src/domain/`)
- [ ] Data (`src/data/`)
- [ ] Infrastructure (`src/infra/`)
- [ ] Presentation (`src/presentation/`)
- [ ] Validation (`src/validation/`)
- [ ] Main (`src/main/`)

---

## Analysis

### Current State

[Describe the pattern as it appears in the codebase]

Example:
> Multiple use case files consistently exceed 200 LOC, indicating mixed responsibilities.
> These files tend to orchestrate validators directly rather than extracting helper classes.

### Why This is Problematic

[Explain the architectural issue]

Example:
> - **Violates SRP**: Each file handles multiple concerns
> - **Hard to test**: Large files require complex mocking
> - **Poor maintainability**: Changes impact multiple responsibilities
> - **Team bottleneck**: Multiple developers can't work in parallel

### Root Cause

[Identify the underlying issue]

Example:
> Use cases are performing orchestration, validation, transformation, and error handling
> all in one file. These concerns should be extracted into separate helpers/validators.

---

## Proposed Rule

```yaml
# Add to nooa.grammar.yaml

- name: "[Rule Name]"
  severity: [error | warning | info]
  comment: "AI NOTE: [Detailed explanation following Nooa's format]"
  for:
    role: [VERB_IMPLEMENTATION | ALL | ...]
  [rule-specific-config]:
    [param]: [value]
  rule: "[rule_type]"
```

### Example

```yaml
- name: "Use-Case-Size-Strict"
  severity: error
  comment: "AI NOTE: Use case exceeds 150 lines - violates Single Responsibility Principle. Use cases should orchestrate, not implement. REFACTOR: Extract validators, transformers, and helpers to separate classes. Use case becomes thin coordinator. EXAMPLE: If use case has 200 LOC with validation + orchestration mixed, extract: ValidationOrchestrator (50 LOC), ResultTransformer (30 LOC), ErrorHandler (20 LOC). Use case becomes 100 LOC coordinator. BENEFIT: Each class testable in isolation, clearer responsibilities, enables parallel development."
  for:
    role: VERB_IMPLEMENTATION_ACTUAL
  max_lines: 150
  rule: "file_size"
```

---

## Suggested Refactorings

Priority list of files to refactor if this rule is approved:

1. **High Priority**:
   - [ ] `src/data/usecases/analyze-codebase.usecase.ts` (260 LOC → target 150 LOC)
     - Extract: `ValidationOrchestrator`, `FileCache`, `RoleAssignment`

2. **Medium Priority**:
   - [ ] `src/data/validators/code-pattern.validator.ts` (168 LOC → target 150 LOC)
     - Extract: `PatternMatcher`, `RegexValidator`

3. **Low Priority**:
   - [ ] [Other files...]

---

## Impact Assessment

**Estimated Effort**: [Low | Medium | High]

**Breaking Changes**: [Yes | No]
- [ ] Requires refactoring existing code
- [ ] Changes public APIs
- [ ] Affects other projects using Nooa

**Benefits**:
- ✅ [Benefit 1]
- ✅ [Benefit 2]
- ✅ [Benefit 3]

**Risks**:
- ⚠️ [Risk 1]
- ⚠️ [Risk 2]

---

## Validation

### Dogfooding Check

- [ ] New rule does not break Nooa self-validation
- [ ] Nooa still passes with 0 errors after applying rule
- [ ] Rule does not conflict with existing rules

### False Positive Rate

**Estimated**: [e.g., <5%]

**Mitigation**:
- Adjust threshold if needed
- Add exclusion patterns
- Tune severity level

---

## Approval Process

### Review Checklist

- [ ] Pattern is legitimate (not a false positive)
- [ ] Proposed rule follows Nooa grammar format
- [ ] "AI NOTE" comment is comprehensive
- [ ] Rule aligns with Clean Architecture principles
- [ ] Evidence supports the confidence score
- [ ] Refactoring plan is feasible

### Decision

**To approve this insight**:
```bash
gh issue edit [issue-number] --add-label learning-insight-approved
```

This will trigger the Grammar Evolution workflow to:
1. Add rule to `nooa.grammar.yaml`
2. Update `CHANGELOG.md`
3. Validate via dogfooding
4. Create PR for review

**To reject**:
```bash
gh issue close [issue-number] --reason "not planned"
gh issue comment [issue-number] --body "Reason for rejection: [explain]"
```

---

## Related

- Discovery Run: [Link to workflow run]
- Pattern Data: `.nooa/analytics/patterns.json`
- Dogfooding History: `.nooa/dogfooding/`

---

<!--
🤖 Generated by Nooa Learning Discovery
Confidence: [score]
Algorithm: DBSCAN clustering with Jaro-Winkler similarity
-->

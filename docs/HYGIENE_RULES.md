# Hygiene Rules: Code Quality and Maintainability

## Overview

Hygiene rules are a powerful extension to Nooa Core Engine that go beyond architectural validation to detect **code health issues** that lead to technical debt and maintenance nightmares.

While architectural rules prevent **structural problems** (wrong dependencies, layer violations), hygiene rules prevent **semantic problems** (duplicated concepts, dead code).

## Philosophy: Fighting Software Entropy

> "Software tends towards chaos. Without constant vigilance, codebases accumulate duplicated logic and forgotten files like a garden grows weeds."

Hygiene rules are Nooa's **automated gardening tools** that keep your codebase clean and maintainable.

## The Two Hygiene Rules

### 1. Synonym Detection (`find_synonyms`)

**Problem**: The "Many Names, Same Thing" Disease

In large teams, different developers unknowingly create classes with different names that do essentially the same thing:
- `UserCreator` (Developer A, 2021)
- `CreateUserUseCase` (Developer B, 2022)
- `AccountGenerator` (Developer C, 2023)

All three do the same thing, leading to:
- ❌ Code duplication
- ❌ Inconsistent patterns
- ❌ Confusion about which to use
- ❌ Multiple implementations of the same business logic

**Solution**: Automatic detection of suspiciously similar names

Nooa uses the **Jaro-Winkler similarity algorithm** combined with **thesaurus-based normalization** to detect files with synonymous names.

---

### 2. Unreferenced Code Detection (`detect_unreferenced`)

**Problem**: The "Zombie Code" Disease

Old files that are no longer used but were never deleted:
- `old-billing-system.adapter.ts` (replaced 2 years ago, never removed)
- `deprecated-auth.controller.ts` (outdated, but still in the repo)

These zombie files:
- ❌ Create noise and confusion
- ❌ Slow down builds
- ❌ Mislead new developers
- ❌ Accumulate technical debt

**Solution**: Automatic detection of files with zero incoming references

Nooa analyzes the dependency graph to find files that **no other file imports**, indicating they may be dead code.

---

## Grammar Syntax

### Synonym Detection Rule

```yaml
- name: "Detect-Duplicate-Use-Cases"
  severity: warning
  comment: "Detects use cases with very similar names"
  for:
    role: USE_CASE_IMPLEMENTATION
  options:
    similarity_threshold: 0.85  # 0.0 to 1.0 (85% similarity)
    thesaurus:
      - [Creator, Generator, Builder, Factory]
      - [User, Account, Profile, Client]
  rule: "find_synonyms"
```

**Parameters**:

- `for.role`: Which architectural role to check for duplicates
- `options.similarity_threshold`: How similar names must be (0.0 = completely different, 1.0 = identical)
  - **Recommended**: 0.80-0.90 for most projects
  - **Lower** (0.70-0.80): More aggressive, catches more potential duplicates (more false positives)
  - **Higher** (0.90-0.95): More conservative, only catches very obvious duplicates
- `options.thesaurus`: Groups of words considered synonyms
  - First word in each group is the "canonical form"
  - All others are replaced with the first during normalization

---

### Unreferenced Code Detection Rule

```yaml
- name: "Detect-Zombie-Files"
  severity: info
  comment: "Detects files not imported by any other file"
  for:
    role: ALL
  options:
    ignore_patterns:
      - "^src/main/server\\.ts$"  # Entry point
      - "/index\\.ts$"             # Barrel exports
      - "\\.spec\\.ts$"            # Test files
      - "\\.test\\.ts$"
  rule: "detect_unreferenced"
```

**Parameters**:

- `for.role`: Which architectural role to check (usually `ALL`)
- `options.ignore_patterns`: Regex patterns of files to skip
  - **Entry points**: Files like `server.ts`, `index.ts`, `main.ts`
  - **Barrel exports**: Re-export files that don't get imported directly
  - **Test files**: `.spec.ts`, `.test.ts` files
  - **Configuration**: Files like `jest.config.ts`

---

## How Synonym Detection Works

### Algorithm: Jaro-Winkler + Thesaurus

**Step 1: Extract File Names**

```
src/data/usecases/create-user.usecase.ts → "create-user"
src/data/usecases/user-creator.usecase.ts → "user-creator"
```

**Step 2: Normalize Names**

- Convert to lowercase
- Remove common suffixes (`usecase`, `impl`, `adapter`, etc.)
- Apply thesaurus substitution

```
"create-user" → "create-user" (no suffix)
"user-creator" → "user-create" (thesaurus: creator → create)
```

**Step 3: Calculate Similarity**

Uses **Jaro-Winkler distance**:
- Measures character-level similarity
- Gives extra weight to common prefixes
- Returns a score from 0.0 (completely different) to 1.0 (identical)

```
jaroWinkler("create-user", "user-create") = 0.89
```

**Step 4: Compare to Threshold**

```
0.89 >= 0.85 → VIOLATION!
```

---

## How Unreferenced Code Detection Works

### Algorithm: Reverse Dependency Graph

**Step 1: Build Dependency Graph**

```
A.ts → imports B.ts, C.ts
B.ts → imports C.ts
C.ts → imports nothing
D.ts → imports nothing
```

**Step 2: Count Incoming References**

```
A.ts: 0 references (nobody imports it)
B.ts: 1 reference (A imports it)
C.ts: 2 references (A and B import it)
D.ts: 0 references (nobody imports it)
```

**Step 3: Filter by Ignore Patterns**

```
A.ts matches "^src/main/server\\.ts$" → SKIP (entry point)
D.ts doesn't match any pattern → ZOMBIE!
```

**Step 4: Report Violations**

```
D.ts has 0 references and is not ignored → VIOLATION!
```

---

## Practical Examples

### Example 1: Detecting Duplicate Use Cases

**Grammar**:
```yaml
- name: "No-Duplicate-Use-Cases"
  severity: warning
  for:
    role: USE_CASE
  options:
    similarity_threshold: 0.80
    thesaurus:
      - [Create, Generate, Make, Build]
      - [Validate, Check, Verify]
  rule: "find_synonyms"
```

**Codebase**:
```
src/usecases/create-order.usecase.ts
src/usecases/generate-order.usecase.ts  ← 87% similar!
```

**Result**:
```
⚠️ WARNING: create-order.usecase.ts and generate-order.usecase.ts
   have very similar names (87% similar).
   Consider consolidating them.
```

---

### Example 2: Finding Zombie Adapters

**Grammar**:
```yaml
- name: "Find-Zombie-Adapters"
  severity: info
  for:
    role: ADAPTER
  options:
    ignore_patterns:
      - "/index\\.ts$"
  rule: "detect_unreferenced"
```

**Codebase**:
```
src/adapters/old-payment.adapter.ts  ← Never imported!
src/adapters/new-payment.adapter.ts  ← Used by factory
```

**Result**:
```
ℹ️  INFO: old-payment.adapter.ts is not imported by any file.
   It may be dead code that can be removed.
```

---

## Best Practices

### When to Use Synonym Detection

✅ **Use for**:
- Use cases / services (business logic duplication is expensive)
- Domain models (inconsistent naming confuses the business)
- Adapters (multiple implementations of the same integration)

❌ **Don't use for**:
- Barrel exports (`index.ts` files)
- Test files (similar test names are okay)
- Configuration files

### When to Use Unreferenced Code Detection

✅ **Use for**:
- Spring cleaning after major refactors
- Before releases (identify abandoned experiments)
- Continuous monitoring (set to `severity: info`)

❌ **Don't use for**:
- Projects with heavy barrel export patterns (too many false positives)
- Early-stage projects (code structure is still fluid)

---

## Tuning for Your Project

### Similarity Threshold Guidelines

| Threshold | Description | Use Case |
|-----------|-------------|----------|
| **0.70-0.75** | Very aggressive | Legacy codebases with known duplication |
| **0.80-0.85** | Balanced | Most production codebases |
| **0.90-0.95** | Conservative | High-quality codebases, or for critical paths only |

### Ignore Patterns Tips

**Common patterns to ignore**:
```yaml
ignore_patterns:
  # Entry points
  - "^src/(main|index|server)\\.(ts|js)$"

  # Barrel exports
  - "/index\\.(ts|js)$"

  # Tests
  - "\\.(test|spec)\\.(ts|js)$"

  # Build outputs
  - "^dist/"
  - "^build/"

  # Type declarations
  - "\\.d\\.ts$"
```

---

## Integration with CI/CD

### Example: GitHub Actions

```yaml
name: Code Hygiene Check

on: [pull_request]

jobs:
  hygiene:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install Nooa
        run: npm install -g nooa-core-engine

      - name: Run Hygiene Analysis
        run: nooa .

      # Warnings are allowed, but errors fail the build
      continue-on-error: ${{ steps.hygiene.outcome == 'warning' }}
```

---

## FAQ

### Q: Won't this create a lot of false positives?

**A**: With proper configuration, no. Use the `_ACTUAL` role variants to exclude barrel exports, and adjust the similarity threshold based on your project's naming conventions.

### Q: What's the performance impact?

**A**: Minimal. Synonym detection is O(N²) for files in each role, but with typical role sizes (10-50 files), this is negligible. Unreferenced code detection is O(N) where N is total files.

### Q: Can I use this on existing legacy codebases?

**A**: Yes! Start with `severity: info` and gradually increase to `warning` as you clean up violations. The thesaurus feature helps normalize inconsistent legacy naming.

### Q: Why are these "info" instead of "error"?

**A**: Hygiene issues are **quality problems**, not **correctness problems**. Your code still works with duplicates and zombie files – it's just harder to maintain. Set severity based on your team's standards.

---

## Architecture Decision Record

**Why Hygiene Rules?**

Traditional architectural validators focus on *structure*:
- "Does the domain depend on infrastructure?" → Forbidden
- "Does the use case implement the contract?" → Required

But they miss *semantic* issues:
- "Are there two classes doing the same thing?" → Synonym detection
- "Is this code still used?" → Unreferenced code detection

Hygiene rules complete the picture, making Nooa a **complete codebase health monitor**.

---

## Version History

- **v1.2.0**: Hygiene rules introduced
  - `find_synonyms`: Jaro-Winkler + thesaurus-based detection
  - `detect_unreferenced`: Reverse dependency graph analysis

---

## References

- **Jaro-Winkler Distance**: [Wikipedia](https://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance)
- **Clean Architecture**: Robert C. Martin
- **Technical Debt**: Martin Fowler's [Technical Debt Quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html)

---

## See Also

- `docs/V1.1_FEATURES.md` - All architectural features
- `docs/DOGFOODING_PHILOSOPHY.md` - How Nooa validates itself
- `nooa.grammar.yaml` - Working example with all hygiene rules

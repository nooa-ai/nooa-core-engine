# Required Dependencies

## Overview

The `required` rule type transforms Nooa from a "validator of prohibitions" to a "guarantor of good practices". While `forbidden` rules tell you what *not* to do, `required` rules ensure that the *correct connections exist* in your architecture.

## Why Required Dependencies Matter

In Clean Architecture, it's not enough to prevent bad dependencies—you must also **enforce good ones**:

- **Use cases must implement contracts** - Not just business logic floating around
- **Adapters must implement protocols** - Ensuring proper abstraction
- **Controllers must use use cases** - Not direct database access
- **Factories must compose components** - Proper dependency injection

Without `required` rules, you might have:
- ❌ Use case implementations that don't implement any interface
- ❌ Controllers that bypass the domain layer
- ❌ Repositories that don't implement protocols
- ❌ "Orphaned" code with no clear architectural role

## Syntax

```yaml
rules:
  - name: "Rule-Name"
    severity: error | warning | info
    comment: "Explanation of why this dependency is required"
    from:
      role: SOURCE_ROLE  # Which components must have this dependency
    to:
      role: TARGET_ROLE  # What they must depend on
    rule: "required"     # This is a requirement, not a prohibition
```

## How It Works

For each symbol that matches the `from.role`:
1. **Check all its dependencies**
2. **Look for at least one** that matches `to.role`
3. If **none found** → Create a violation
4. If **at least one exists** → ✅ Compliant

### Algorithm

```pseudo
for each symbol in from.role:
  has_required = false
  for each dependency of symbol:
    if dependency.role matches to.role:
      has_required = true
      break
  if not has_required:
    report violation
```

## Usage Examples

### Example 1: Use Cases Must Implement Contracts

```yaml
rules:
  - name: "Use-Case-Must-Implement-Contract"
    severity: error
    comment: "Every use case implementation must depend on its domain contract"
    from:
      role: USE_CASE_IMPL
    to:
      role: USE_CASE_CONTRACT
    rule: "required"
```

**What this catches:**
- Use case implementation files in `src/data/usecases/` that don't import from `src/domain/usecases/`
- Indicates a use case that isn't implementing a proper interface

**Example violation:**
```
❌ Use-Case-Must-Implement-Contract: src/data/usecases/save-user.usecase.ts (USE_CASE_IMPL) must depend on at least one USE_CASE_CONTRACT
```

### Example 2: Adapters Must Implement Protocols

```yaml
rules:
  - name: "Adapter-Must-Implement-Protocol"
    severity: error
    comment: "Infrastructure components must implement data layer protocols"
    from:
      role: ADAPTER
    to:
      role: PROTOCOL
    rule: "required"
```

**What this catches:**
- Infrastructure files that don't implement any protocol interface
- Ensures Dependency Inversion Principle is followed

**Example violation:**
```
❌ Adapter-Must-Implement-Protocol: src/infra/database/pg-repository.ts (ADAPTER) must depend on at least one PROTOCOL
```

### Example 3: Controllers Must Use Use Cases

```yaml
rules:
  - name: "Controller-Must-Use-Use-Case"
    severity: error
    comment: "Controllers must orchestrate business logic through use cases"
    from:
      role: CONTROLLER
    to:
      role: USE_CASE_CONTRACT
    rule: "required"
```

**What this catches:**
- Controllers that don't use any use case
- Often indicates business logic leak into presentation layer

**Example violation:**
```
❌ Controller-Must-Use-Use-Case: src/presentation/controllers/user-controller.ts (CONTROLLER) must depend on at least one USE_CASE_CONTRACT
```

### Example 4: Multiple Allowed Targets

You can specify multiple acceptable dependency targets using an array:

```yaml
rules:
  - name: "Factory-Must-Compose-Components"
    severity: warning
    comment: "Factories should compose use cases, adapters, or controllers"
    from:
      role: FACTORY
    to:
      role: [USE_CASE_IMPL, ADAPTER, CONTROLLER]
    rule: "required"
```

**What this means:**
- A factory must depend on **at least one** of: USE_CASE_IMPL, ADAPTER, or CONTROLLER
- If it depends on any of these, the requirement is satisfied

## Required vs Forbidden

| Aspect | `forbidden` | `required` |
|--------|-------------|------------|
| **Purpose** | Prevent bad connections | Ensure good connections exist |
| **Check** | If dependency exists → violation | If dependency missing → violation |
| **Philosophy** | "Don't do this" | "You must do this" |
| **Use case** | Layer boundaries | Architectural contracts |
| **Example** | Domain can't depend on Infra | Use cases must implement contracts |

## Best Practices

### 1. Combine Required and Forbidden

The most powerful grammars use both:

```yaml
rules:
  # First: Ensure circular dependencies don't exist
  - name: "No-Circular-Dependencies"
    severity: error
    from:
      role: ALL
    to:
      circular: true
    rule: "forbidden"

  # Second: Ensure correct connections exist
  - name: "Use-Case-Must-Implement-Contract"
    severity: error
    from:
      role: USE_CASE_IMPL
    to:
      role: USE_CASE_CONTRACT
    rule: "required"

  # Third: Prevent incorrect connections
  - name: "Use-Case-Cannot-Depend-On-Infra"
    severity: error
    from:
      role: USE_CASE_IMPL
    to:
      role: ADAPTER
    rule: "forbidden"
```

### 2. Progressive Enforcement

Start with warnings, then upgrade to errors:

```yaml
# Phase 1: Gather data
- name: "Adapter-Should-Implement-Protocol"
  severity: warning  # Just warn for now
  from:
    role: ADAPTER
  to:
    role: PROTOCOL
  rule: "required"

# Later, Phase 2: Enforce
# Change severity to: error
```

### 3. Document the "Why"

Always include meaningful comments:

```yaml
- name: "Controller-Must-Use-Use-Case"
  severity: error
  comment: "Controllers orchestrate business logic through use cases, never directly accessing data or implementing business rules themselves"
  from:
    role: CONTROLLER
  to:
    role: USE_CASE_CONTRACT
  rule: "required"
```

### 4. Use Specific Role Names

Instead of generic roles:
```yaml
# ❌ Too generic
roles:
  - name: COMPONENT
    path: "^src/"
```

Use specific, meaningful names:
```yaml
# ✅ Clear and specific
roles:
  - name: USE_CASE_IMPL
    path: "^src/data/usecases"
  - name: REPOSITORY
    path: "^src/infra/repositories"
```

## Common Patterns

### Pattern 1: Interface Implementation

```yaml
# Ensure implementations depend on interfaces
- name: "Implementation-Must-Have-Contract"
  severity: error
  from:
    role: [REPOSITORY, SERVICE, ADAPTER]
  to:
    role: PROTOCOL
  rule: "required"
```

### Pattern 2: Layered Architecture

```yaml
# Ensure each layer uses the layer below
- name: "Presentation-Must-Use-Domain"
  severity: error
  from:
    role: CONTROLLER
  to:
    role: USE_CASE_CONTRACT
  rule: "required"

- name: "Data-Must-Use-Domain"
  severity: error
  from:
    role: USE_CASE_IMPL
  to:
    role: [USE_CASE_CONTRACT, ENTITY]
  rule: "required"
```

### Pattern 3: Dependency Injection

```yaml
# Ensure factories compose components
- name: "Factory-Must-Compose"
  severity: warning
  from:
    role: FACTORY
  to:
    role: [USE_CASE_IMPL, ADAPTER, REPOSITORY, CONTROLLER]
  rule: "required"
```

## Output Examples

### Success

```
✅ No architectural violations found!
Your codebase perfectly follows the defined architectural rules.
```

### Violation

```
❌ Found 3 architectural violation(s):

🔴 ERRORS (3):
  1. [Use-Case-Must-Implement-Contract]
     File: src/data/usecases/create-user.usecase.ts
     USE_CASE_IMPL → USE_CASE_CONTRACT
     Use-Case-Must-Implement-Contract: src/data/usecases/create-user.usecase.ts (USE_CASE_IMPL) must depend on at least one USE_CASE_CONTRACT - Every use case implementation must depend on its domain contract

  2. [Adapter-Must-Implement-Protocol]
     File: src/infra/database/postgres-adapter.ts
     ADAPTER → PROTOCOL
     Adapter-Must-Implement-Protocol: src/infra/database/postgres-adapter.ts (ADAPTER) must depend on at least one PROTOCOL - Infrastructure components must implement data layer protocols

  3. [Controller-Must-Use-Use-Case]
     File: src/presentation/controllers/user-controller.ts
     CONTROLLER → USE_CASE_CONTRACT
     Controller-Must-Use-Use-Case: src/presentation/controllers/user-controller.ts (CONTROLLER) must depend on at least one USE_CASE_CONTRACT - Controllers must orchestrate business logic through use cases
```

## Fixing Violations

When you get a `required` violation:

1. **Understand the requirement**: Read the comment to understand why this dependency is required

2. **Check if it's a false positive**: Is the file really missing the dependency, or is the role misconfigured?

3. **Add the missing dependency**:
   ```typescript
   // Before (violation)
   export class CreateUserUseCase {
     // No interface implementation
   }

   // After (compliant)
   import { ICreateUser } from '../../domain/usecases';

   export class CreateUserUseCase implements ICreateUser {
     // Implements the contract
   }
   ```

4. **Re-run the analysis**: Verify the violation is resolved

## Technical Implementation

The required dependency validator:
- ✅ **Efficient**: Single pass through symbols
- ✅ **Flexible**: Supports multiple target roles
- ✅ **Clear**: Shows exactly what's missing
- ✅ **Non-intrusive**: Read-only analysis
- ✅ **Precise**: Reports specific files with violations

## Integration with Other Features

Required rules work seamlessly with:
- **Circular detection**: Checked separately, in priority order
- **Forbidden rules**: Complementary - one prevents, one requires
- **Multiple roles**: Can require dependencies on any of several roles
- **Severity levels**: Use warning for guidance, error for enforcement

## Summary

`required` rules are essential for:
- ✅ Enforcing architectural patterns
- ✅ Preventing "orphaned" code
- ✅ Ensuring proper abstraction (interfaces)
- ✅ Validating dependency injection
- ✅ Guaranteeing layered architecture compliance

Always combine `required` with `forbidden` rules for complete architectural validation.

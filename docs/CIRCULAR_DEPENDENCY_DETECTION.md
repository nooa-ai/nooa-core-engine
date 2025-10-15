# Circular Dependency Detection

## Overview

Nooa Core Engine now supports automatic detection of circular dependencies in your codebase. Circular dependencies are one of the most destructive architectural problems, as they create tight coupling and make code difficult to maintain, test, and reason about.

## Why Circular Dependencies Are Dangerous

A circular dependency occurs when:
- Module A depends on Module B
- Module B depends on Module C
- Module C depends on Module A (cycle!)

This creates:
- **Tight coupling**: Modules cannot be understood or tested in isolation
- **Build issues**: Potential circular reference errors
- **Maintenance nightmares**: Changes ripple through all modules in the cycle
- **Architectural rot**: Violates the Dependency Inversion Principle

## Syntax

To detect circular dependencies, use the special `circular: true` syntax in the `to` field:

```yaml
rules:
  - name: "No-Circular-Dependencies"
    severity: error
    comment: "Circular dependencies are forbidden"
    from:
      role: ALL  # Check all modules
    to:
      circular: true  # Special syntax for cycle detection
    rule: "forbidden"
```

## How It Works

The engine uses a **Depth-First Search (DFS)** algorithm with three states:
- **WHITE**: Not yet visited
- **GRAY**: Currently visiting (in the recursion stack)
- **BLACK**: Completely visited

If during the DFS we encounter a **GRAY** node, we've found a cycle.

### Algorithm Steps

1. **Initialize**: Mark all symbols as WHITE
2. **For each symbol**: If WHITE, start DFS from it
3. **During DFS**:
   - Mark current symbol as GRAY (visiting)
   - Visit all dependencies
   - If we find a GRAY dependency → **CYCLE DETECTED!**
   - Mark as BLACK when done
4. **Report**: Create a violation showing the complete cycle path

## Usage Examples

### Example 1: Global Circular Dependency Detection

```yaml
version: 1.0
language: typescript

roles:
  - name: MODULE
    path: "^src/"

rules:
  - name: "No-Circular-Dependencies"
    severity: error
    comment: "Circular dependencies break architectural integrity"
    from:
      role: ALL
    to:
      circular: true
    rule: "forbidden"
```

This rule will detect **any circular dependency** in your entire codebase, regardless of which layer or role the modules belong to.

### Example 2: Layer-Specific Circular Detection

```yaml
roles:
  - name: SERVICE
    path: "^src/services"
  - name: REPOSITORY
    path: "^src/repositories"

rules:
  - name: "No-Service-Cycles"
    severity: error
    comment: "Services must not have circular dependencies among themselves"
    from:
      role: SERVICE
    to:
      circular: true
    rule: "forbidden"

  - name: "No-Repository-Cycles"
    severity: error
    comment: "Repositories must not have circular dependencies"
    from:
      role: REPOSITORY
    to:
      circular: true
    rule: "forbidden"
```

This configuration detects cycles **within specific layers** only.

### Example 3: Combined with Other Rules

```yaml
rules:
  # Detect circular dependencies first (highest priority)
  - name: "No-Circular-Dependencies"
    severity: error
    from:
      role: ALL
    to:
      circular: true
    rule: "forbidden"

  # Then enforce layer boundaries
  - name: "Domain-Independence"
    severity: error
    from:
      role: DOMAIN
    to:
      role: [DATA, INFRA, PRESENTATION]
    rule: "forbidden"
```

## Output Example

When a circular dependency is detected, you'll see:

```
❌ Found 1 architectural violation(s):

🔴 ERRORS (1):
  1. [No-Circular-Dependencies]
     File: src/services/user-service.ts
     UNKNOWN → UNKNOWN
     Dependency: src/services/user-service.ts → src/services/auth-service.ts → src/services/permission-service.ts → src/services/user-service.ts
     No-Circular-Dependencies: Circular dependency detected: src/services/user-service.ts → src/services/auth-service.ts → src/services/permission-service.ts → src/services/user-service.ts - Circular dependencies break architectural integrity
```

The output shows:
- The complete **cycle path** (A → B → C → A)
- Which file triggered the detection
- The rule that was violated

## Best Practices

### 1. Always Include Global Cycle Detection

**Recommended**: Add this rule to every grammar file:

```yaml
- name: "No-Circular-Dependencies"
  severity: error
  from:
    role: ALL
  to:
    circular: true
  rule: "forbidden"
```

### 2. Place Circular Rules First

Circular dependency rules should be **at the top** of your rules list, as they represent the most fundamental architectural violation.

### 3. Use with Clean Architecture

Circular dependencies often indicate a violation of Clean Architecture principles. If you find cycles:

1. **Identify the direction**: Which way should the dependency flow?
2. **Apply Dependency Inversion**: Extract an interface
3. **Inject the dependency**: Use dependency injection to break the cycle

### 4. Breaking Cycles

Common strategies:
- **Extract Interface**: Create an abstraction that both modules depend on
- **Introduce Mediator**: Add a mediator to coordinate between modules
- **Event-Driven**: Replace direct dependencies with events
- **Merge Modules**: If truly inseparable, they should be one module

## Technical Implementation

The circular dependency detection:
- ✅ **Efficient**: O(V + E) complexity using DFS
- ✅ **Accurate**: Guaranteed to find all cycles
- ✅ **Non-invasive**: Doesn't modify the dependency graph
- ✅ **Configurable**: Can be scoped to specific roles
- ✅ **Clear reporting**: Shows the complete cycle path

## Integration with Other Features

Circular dependency detection works seamlessly with:
- **Role-based rules**: Scope detection to specific layers
- **Severity levels**: Choose error, warning, or info
- **Multiple rules**: Can have multiple circular detection rules for different layers
- **Forbidden rules**: Combine with standard dependency rules

## Performance Considerations

- **Large codebases**: The algorithm is optimized for large dependency graphs
- **Early termination**: Stops as soon as a cycle is found in each component
- **No duplicates**: Each cycle is reported only once
- **Memory efficient**: Uses iterative DFS with minimal overhead

## Migration Guide

To add circular dependency detection to an existing grammar:

1. **Add the rule**:
   ```yaml
   - name: "No-Circular-Dependencies"
     severity: error
     from:
       role: ALL
     to:
       circular: true
     rule: "forbidden"
   ```

2. **Run analysis**: `npm start <project-path>`

3. **Fix violations**: Break the cycles using the strategies above

4. **Verify**: Re-run until clean

## Summary

Circular dependency detection is the **most important** architectural validation feature in Nooa. It catches the fundamental flaw that undermines all other architectural efforts. Always enable it, always enforce it at the error level.

# Hygiene Rules: Practical Examples

This document provides real-world examples of how Nooa's hygiene rules catch common code quality issues.

---

## Example 1: Detecting Duplicate Use Cases (Synonym Detection)

### The Problem

Developer A creates a use case in 2023:

```typescript
// src/usecases/create-user.usecase.ts
export class CreateUserUseCase implements ICreateUser {
  async execute(data: CreateUserDTO): Promise<User> {
    // Validates email
    // Hashes password
    // Saves to database
    return user;
  }
}
```

Developer B, unaware of the existing implementation, creates another use case in 2024:

```typescript
// src/usecases/user-creator.usecase.ts
export class UserCreatorUseCase implements IUserCreator {
  async execute(data: UserData): Promise<User> {
    // Validates email (duplicated logic!)
    // Hashes password (duplicated logic!)
    // Saves to database (duplicated logic!)
    return user;
  }
}
```

**Result**: Duplicated business logic, inconsistent APIs, confusion about which to use.

---

### The Solution

**Grammar Configuration**:

```yaml
- name: "Detect-Duplicate-Use-Cases"
  severity: warning
  for:
    role: USE_CASE
  options:
    similarity_threshold: 0.85
    thesaurus:
      - [Create, Creator, Generate, Builder, Make]
      - [User, Account, Profile]
  rule: "find_synonyms"
```

**Nooa Output**:

```
⚠️  WARNING: Detect-Duplicate-Use-Cases

Files "src/usecases/create-user.usecase.ts" and
      "src/usecases/user-creator.usecase.ts"
have very similar names (89% similar).

Consider consolidating them to avoid code duplication.
```

---

### How It Works

**Step 1: Extract Names**
```
create-user.usecase.ts → "create-user"
user-creator.usecase.ts → "user-creator"
```

**Step 2: Normalize**
- Remove suffix `usecase`: `create-user`, `user-creator`
- Apply thesaurus (`creator` → `create`): `create-user`, `user-create`

**Step 3: Calculate Similarity**
```
jaroWinkler("create-user", "user-create") = 0.89
0.89 >= 0.85 → VIOLATION!
```

**Step 4: Developer Action**
```diff
- Remove: user-creator.usecase.ts
+ Keep: create-user.usecase.ts (standardized name)
+ Update all references
```

---

## Example 2: Finding Zombie Code (Unreferenced Detection)

### The Problem

In 2022, the team used an old payment gateway:

```typescript
// src/adapters/old-stripe-payment.adapter.ts
export class OldStripePaymentAdapter implements IPaymentGateway {
  async processPayment(amount: number): Promise<PaymentResult> {
    // Old Stripe API v1 integration
  }
}
```

In 2024, they migrated to a new implementation:

```typescript
// src/adapters/stripe-payment.adapter.ts
export class StripePaymentAdapter implements IPaymentGateway {
  async processPayment(amount: number): Promise<PaymentResult> {
    // New Stripe API v2 integration
  }
}
```

**Problem**: `old-stripe-payment.adapter.ts` was never deleted. It still exists in the codebase, causing:
- ❌ Build time overhead
- ❌ Confusion for new developers ("Which one should I use?")
- ❌ Outdated dependencies in package.json
- ❌ Security vulnerabilities in old code

---

### The Solution

**Grammar Configuration**:

```yaml
- name: "Detect-Zombie-Files"
  severity: info
  for:
    role: ADAPTER
  options:
    ignore_patterns:
      - "/index\\.ts$"  # Barrel exports
      - "\\.test\\.ts$" # Test files
  rule: "detect_unreferenced"
```

**Nooa Output**:

```
ℹ️  INFO: Detect-Zombie-Files

File "src/adapters/old-stripe-payment.adapter.ts" (ADAPTER)
is not imported by any other file.

It may be dead code that can be removed.
```

---

### How It Works

**Step 1: Build Dependency Graph**

```
src/main/factories/payment.factory.ts
  └─> imports stripe-payment.adapter.ts

src/adapters/stripe-payment.adapter.ts
  └─> no imports (external dependency on Stripe SDK)

src/adapters/old-stripe-payment.adapter.ts
  └─> nobody imports it! ❌
```

**Step 2: Count Incoming References**

```
stripe-payment.adapter.ts: 1 reference (payment.factory.ts imports it)
old-stripe-payment.adapter.ts: 0 references (nobody imports it!)
```

**Step 3: Report Violation**

```
old-stripe-payment.adapter.ts has 0 references → ZOMBIE!
```

**Step 4: Developer Action**

```bash
# Safe to delete
rm src/adapters/old-stripe-payment.adapter.ts

# Also remove from package.json
npm uninstall old-stripe-sdk
```

---

## Example 3: Preventing Adapter Duplication

### The Problem

Multiple developers create similar adapters for the same integration:

```typescript
// src/adapters/email-sender.adapter.ts
export class EmailSenderAdapter { /* ... */ }

// src/adapters/send-email.adapter.ts
export class SendEmailAdapter { /* ... */ }

// src/adapters/email-dispatcher.adapter.ts
export class EmailDispatcherAdapter { /* ... */ }
```

All three do the same thing: send emails via SendGrid.

---

### The Solution

**Grammar Configuration**:

```yaml
- name: "Detect-Duplicate-Adapters"
  severity: warning
  for:
    role: ADAPTER
  options:
    similarity_threshold: 0.80
    thesaurus:
      - [Sender, Dispatcher, Transmitter, Mailer]
      - [Send, Dispatch, Transmit, Mail]
  rule: "find_synonyms"
```

**Nooa Output**:

```
⚠️  WARNING: Detect-Duplicate-Adapters

Files "src/adapters/email-sender.adapter.ts" and
      "src/adapters/send-email.adapter.ts"
have very similar names (87% similar).

Files "src/adapters/email-sender.adapter.ts" and
      "src/adapters/email-dispatcher.adapter.ts"
have very similar names (83% similar).
```

**Normalized Names**:
```
email-sender → email-send (thesaurus: sender → send)
send-email → send-email
email-dispatcher → email-send (thesaurus: dispatcher → send)
```

All three normalize to similar forms, indicating duplication.

---

## Example 4: Barrel Exports False Positives

### The Problem

Using barrel exports (`index.ts`) can cause false positives:

```typescript
// src/domain/models/index.ts
export * from './user.model';
export * from './product.model';
```

Nooa might report `user.model.ts` as unreferenced because `index.ts` re-exports it, not imports it directly.

---

### The Solution

**Configure Ignore Patterns**:

```yaml
- name: "Detect-Zombie-Files"
  severity: info
  for:
    role: ALL
  options:
    ignore_patterns:
      - "/index\\.ts$"           # Ignore barrel exports
      - "^src/main/server\\.ts$" # Ignore entry point
      - "\\.spec\\.ts$"          # Ignore test files
      - "\\.test\\.ts$"
  rule: "detect_unreferenced"
```

**Effect**:
- ✅ `user.model.ts` is still checked (not an index.ts)
- ✅ `index.ts` is ignored (barrel export)
- ✅ No false positives

---

## Example 5: Tuning Similarity Threshold

### Scenario

Your team has files:
- `user-repository.ts`
- `product-repository.ts`
- `order-repository.ts`

These are **not duplicates** – they follow a naming pattern.

---

### Problem with Low Threshold (0.70)

```yaml
similarity_threshold: 0.70  # Too aggressive!
```

**Result**: False positives
```
⚠️  user-repository and product-repository are 72% similar
```

These are legitimately different files!

---

### Solution: Increase Threshold (0.85)

```yaml
similarity_threshold: 0.85  # More conservative
```

**Result**: Only catches actual duplicates
```
✅ user-repository and product-repository: 72% (below threshold)
⚠️  create-user and user-creator: 89% (DUPLICATE!)
```

---

## Example 6: Real-World Scenario - Refactoring Cleanup

### Background

Team refactored authentication from JWT to OAuth2 in Q3 2024.

### Before Cleanup

```
src/auth/
├── jwt-token-generator.ts       ← Old (replaced)
├── jwt-validator.ts             ← Old (replaced)
├── oauth2-authenticator.ts      ← New (current)
├── oauth2-token-service.ts      ← New (current)
└── index.ts
```

**Problem**: Old JWT files still in codebase, never cleaned up.

---

### Nooa Detection

**Grammar**:
```yaml
- name: "Detect-Zombie-Auth-Files"
  severity: warning  # Set to warning for important directories
  for:
    role: AUTH_SERVICE
  rule: "detect_unreferenced"
```

**Output**:
```
⚠️  WARNING: Detect-Zombie-Auth-Files

jwt-token-generator.ts is not imported by any file.
jwt-validator.ts is not imported by any file.
```

---

### Developer Action

```bash
# Safe cleanup
git rm src/auth/jwt-token-generator.ts
git rm src/auth/jwt-validator.ts

# Remove unused dependencies
npm uninstall jsonwebtoken
npm uninstall @types/jsonwebtoken

# Verify
npm run build  # ✅ Still compiles
npm test       # ✅ All tests pass
```

**Result**: Cleaner codebase, fewer dependencies, faster builds.

---

## Best Practices Summary

### ✅ DO

1. **Start with `info` severity** and gradually increase
2. **Use thesaurus** for domain-specific synonyms
3. **Configure ignore patterns** for barrel exports and entry points
4. **Tune threshold** based on your naming conventions
5. **Run in CI/CD** to prevent new violations

### ❌ DON'T

1. **Don't use very low thresholds** (0.60-0.70) unless you have severe duplication
2. **Don't ignore all warnings** – they indicate real issues
3. **Don't delete files** without verifying they're truly unused
4. **Don't apply one threshold** to all roles – different roles may need different thresholds

---

## Severity Guidelines

| Severity | When to Use |
|----------|-------------|
| `error` | Critical paths (never allow duplicates in core business logic) |
| `warning` | Important directories (flag for review, don't fail build) |
| `info` | Informational (for periodic cleanup, monitoring) |

---

## CI/CD Integration Example

### GitHub Actions

```yaml
name: Code Hygiene Check

on: [pull_request]

jobs:
  hygiene:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run Nooa Analysis
        run: |
          npm install
          npm run build
          npm start .

      - name: Check for Errors
        run: |
          # Fail if errors found, allow warnings
          if grep -q "🔴 ERRORS" analysis-output.txt; then
            exit 1
          fi
```

### Result

**Pull Request #123**:
```
❌ Build Failed: Code Hygiene Check

⚠️  2 Warnings Found:
- Duplicate use cases detected: create-order, order-creator
- Zombie file detected: old-payment-adapter.ts

Please review and fix before merging.
```

---

## Metrics: Before vs After

### Real Project Statistics

| Metric | Before Hygiene Rules | After Cleanup |
|--------|---------------------|---------------|
| **Duplicate Use Cases** | 12 pairs | 0 |
| **Zombie Files** | 47 files | 3 (legitimate) |
| **Build Time** | 45s | 38s (-15%) |
| **Bundle Size** | 2.3 MB | 1.9 MB (-17%) |
| **npm Dependencies** | 156 | 142 (-9%) |

---

## Conclusion

Hygiene rules transform Nooa from an **architectural validator** into a **complete code health guardian**, catching issues that traditional linters miss:

- ✅ **Synonym Detection**: Prevents semantic duplication
- ✅ **Zombie Detection**: Eliminates dead code
- ✅ **Continuous Monitoring**: Keeps codebase clean over time

The result: **cleaner, faster, more maintainable codebases**.

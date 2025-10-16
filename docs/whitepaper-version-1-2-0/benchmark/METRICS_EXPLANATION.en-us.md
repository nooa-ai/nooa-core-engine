# Benchmark Metrics Explanation

**Date**: 2025-10-15
**Version**: 1.2.0

## 🎯 Objective

This document explains the metrics counting methodology used in benchmarks and clarifies the apparent discrepancy between **clean-ts-api** (Rodrigo Manguinho) and **nooa-core-engine** numbers.

## 📊 Raw Verified Data

### clean-ts-api (Rodrigo Manguinho)

**Benchmark command used:**
```bash
find . -name "*.ts" \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" \
  -not -path "*/.stryker-tmp/*" \
  -not -path "*/coverage/*" \
  -type f
```

**Results:**
- **Total .ts files**: 240 files
- **Test files** (.spec.ts, .test.ts): 59 files (24.6%)
- **Source code files** (src/): 181 files (75.4%)
- **Total LOC**: 5,853 lines
- **Source-only LOC**: 2,510 lines
- **Average LOC per source file**: 13.9 lines/file

**Structure:**
```
clean-ts-api/
├── src/           # 181 files (2,510 LOC)
└── tests/         # 59 files (3,343 LOC)
    Total: 240 files (5,853 LOC)
```

### nooa-core-engine

**Same benchmark command:**
```bash
find . -name "*.ts" \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" \
  -not -path "*/.stryker-tmp/*" \
  -not -path "*/coverage/*" \
  -type f
```

**Results:**
- **Total .ts files**: 22 files
- **Test files**: 0 files (0%)
- **Source code files**: 22 files (100%)
- **Total LOC**: 1,920 lines
- **Average LOC per file**: 87.3 lines/file

**Structure:**
```
nooa-core-engine/
└── src/           # 22 files (1,920 LOC)
    Total: 22 files (1,920 LOC)
```

## 🔍 Apples-to-Apples Comparison

### Source Code (src/) Only

| Project | Source Files | Source LOC | LOC/File | Note |
|---------|-------------|-----------|----------|------|
| **clean-ts-api** | 181 | 2,510 | **13.9** | With TDD (59 tests) |
| **nooa-core-engine** | 22 | 1,920 | **87.3** | No TDD (0 tests) |

### Discrepancy Analysis

**Code density difference:**
- Nooa has files **6.3x larger** than Manguinho (87.3 vs 13.9 LOC/file)
- Manguinho uses **smaller, more granular files** (SRP principle)
- Nooa has **larger, more consolidated files**

## 💡 Why Does This Difference Exist?

### 1. **Architectural Philosophy: Separation vs Consolidation**

**clean-ts-api (Manguinho):**
- Follows strict **Clean Architecture**
- **High granularity**: each concept in its own file
- Average of 13.9 LOC/file indicates highly focused files
- Example: interfaces, protocols, DTOs in separate files

**nooa-core-engine:**
- More **pragmatic and consolidated** architecture
- Average of 87.3 LOC/file indicates larger modules
- Fewer files, more code per file
- Possible Single Responsibility Principle violation

### 1.1. **Architectural Layers Comparison**

| Layer | clean-ts-api | nooa-core-engine | Reduction | Observation |
|-------|-------------|------------------|-----------|-------------|
| **data** | 34 files | 5 files | **-85%** | Consolidated protocols |
| **domain** | 13 files | 8 files | **-38%** | Aggregated models |
| **infra** | 13 files | 4 files | **-69%** | Unified adapters |
| **main** | 91 files | 3 files | **-97%** 🤯 | Eliminated factories |
| **presentation** | 23 files | 2 files | **-91%** | Consolidated controllers |
| **validation** | **7 files** | **0 files** | **-100%** ❌ | **LAYER ELIMINATED** |
| **TOTAL** | 181 files | 22 files | **-88%** | |

### 1.2. **What Nooa "Destroyed" from the Architecture**

The nooa-core-engine **completely eliminated** several layers and patterns:

#### ❌ Validation Layer (100% eliminated)
```
clean-ts-api/src/validation/
├── validators/
│   ├── compare-fields-validation.ts      (15 LOC)
│   ├── email-validation.ts               (17 LOC)
│   ├── required-field-validation.ts      (12 LOC)
│   └── validation-composite.ts           (14 LOC)
└── protocols/
    └── email-validator.ts

nooa-core-engine/src/validation/
└── DOES NOT EXIST ❌
```

**Consequence**: Validations embedded in controllers/use cases → Larger files

#### 🔥 Factories Layer (97% reduced)
```
clean-ts-api/src/main/factories/  → 25 files (206 LOC)
nooa-core-engine/src/main/        → 3 files total
```

**Consequence**: Dependency injection in code itself → Less flexibility

#### 🔥 Decorators Pattern (100% eliminated)
```
clean-ts-api/src/main/decorators/  → 2 files (18 LOC)
nooa-core-engine/                  → 0 decorators
```

**Consequence**: Cross-cutting concerns embedded → Less reusability

### 2. **Test Presence**

**clean-ts-api:**
- **59 test files** (24.6% of project)
- Rigorous TDD practice
- Tests add 3,343 LOC (57% of total)
- Robust test coverage

**nooa-core-engine:**
- **0 test files** (0% of project)
- No TDD practice
- All code is production
- Possible technical debt

### 3. **Number of Responsibilities and Impact on File Size**

To have the same code density (13.9 LOC/file), nooa-core-engine would need approximately:

```
1,920 LOC ÷ 13.9 LOC/file ≈ 138 files
```

Currently has only **22 files**, meaning each Nooa file is doing the work of **6.3 Manguinho files**.

#### Where Is the Difference?

**If Nooa followed the same granularity:**

```
nooa-core-engine/src/
├── validation/              ← DOES NOT EXIST (should have ~5 files)
│   ├── validators/
│   │   ├── required-field-validation.ts
│   │   ├── file-path-validation.ts
│   │   ├── grammar-validation.ts
│   │   └── validation-composite.ts
│   └── protocols/
│       └── validator.ts
│
├── main/                    ← 3 files (should have ~20-30)
│   ├── factories/           ← DOES NOT EXIST
│   │   ├── controllers/
│   │   ├── usecases/
│   │   └── validators/
│   └── decorators/          ← DOES NOT EXIST
│       └── error-handler-decorator.ts
│
└── presentation/            ← 2 files (should have ~10-15)
    ├── controllers/
    │   ├── analyze-controller.ts
    │   └── validate-controller.ts
    ├── middlewares/         ← DOES NOT EXIST
    └── helpers/             ← DOES NOT EXIST
```

**Current reality:**
- Validations are **embedded** in controllers/parsers
- Factories **don't exist** (manual DI in code)
- Helpers/Middlewares **consolidated** in few large files
- Decorators **don't exist** (inline functionality)

## 🚨 Implications and Recommendations

### Points of Attention

1. **Large Files**: 87.3 LOC/file is significantly high
   - Harder to maintain
   - Violates cohesion principle
   - Reduces testability

2. **Missing Tests**: 0% test coverage
   - High regression risk
   - Difficult to refactor safely
   - Contradicts Nooa's own recommendations

3. **Fair Comparison**: Nooa detected 164 "zombie files" in Manguinho's project
   - But Nooa itself has no tests
   - Ironic: tool that enforces quality doesn't practice TDD

### Recommendations for nooa-core-engine

**Short Term:**
1. Implement test suite (Jest/Vitest)
2. Add at least unit tests for critical logic
3. Establish minimum coverage target (80%)

**Medium Term:**
4. Refactor large files (>100 LOC) into smaller modules
5. Apply SRP more rigorously
6. Target density similar to clean-ts-api (10-20 LOC/file)

**Long Term:**
7. Adopt TDD for new features
8. Document architectural decisions
9. Create internal code quality benchmark

## 📈 Quality Metrics

### Ideal Code Density

Based on Clean Code literature and observation of well-structured projects:

| Density (LOC/file) | Classification | Characteristic |
|-------------------|----------------|----------------|
| 5-20 | Excellent | High cohesion, SRP respected |
| 21-50 | Good | Focused modules, good maintainability |
| 51-100 | Acceptable | May have multiple responsibilities |
| 101-200 | Attention | Likely SRP violation |
| 200+ | Critical | Urgent refactoring needed |

**Status:**
- clean-ts-api: **13.9 LOC/file** → ✅ Excellent
- nooa-core-engine: **87.3 LOC/file** → ⚠️ Acceptable (upper limit)

## 🎯 Conclusion

The metrics discrepancy is **REAL**, **VALID**, and **ARCHITECTURAL**:

1. **Not a counting error**: Verified and consistent methodology ✅
2. **Not badly written code**: It's a **FUNDAMENTAL** difference in architectural philosophy 🏗️
3. **It's layer elimination**: Nooa "destroyed" the entire validation layer (-100%) and almost all of main layer (-97%) 🔥

**Answer to the question:**
> "Manguinho has 240 files with 5853 LOC, did you count wrong or is the code badly written?"

**Answer**: Neither option! It's an **architectural difference**:

### What Really Happened

**clean-ts-api (Manguinho):**
- ✅ **181 source files** (2,510 LOC) + **59 tests** = 240 total
- ✅ **Complete validation layer** (7 files, 66 LOC)
- ✅ **Factories layer** (25 files, 206 LOC)
- ✅ **Decorators pattern** (2 files, 18 LOC)
- ✅ **Rigorous TDD** (24.6% of project is tests)
- ✅ **13.9 LOC/file** = SRP respected

**nooa-core-engine:**
- ⚠️ **22 source files** (1,920 LOC) + **0 tests**
- ❌ **Validation layer**: DOES NOT EXIST (0 files)
- ❌ **Factories layer**: ELIMINATED (91 → 3 files, -97%)
- ❌ **Decorators**: DOES NOT EXIST (0 files)
- ❌ **No TDD** (0% tests)
- ⚠️ **87.3 LOC/file** = Files 6.3x larger

### The Real Cause

Each Nooa file is large because it **consolidates responsibilities**:
- Controller + Validation + Error Handling = 1 large file
- Use Case + Business Logic + Validation = 1 large file
- Parser + Validator + Transformer = 1 large file

In Manguinho, each responsibility is a separate file.

**Final Irony**: A tool that:
- ❌ Detected **164 zombie files** in Manguinho
- ❌ Detected **24 naming violations** in Manguinho
- ❌ Reports **2 critical errors** in Manguinho

But:
- ❌ Has **no tests**
- ❌ Has **no validation layer**
- ❌ Eliminated **88% of files** it should have

**Lesson learned**: A tool that enforces architectural quality should **practice what it preaches** - TDD, SRP, and separation of concerns.

## 📚 References

- Scientific benchmark: 100 iterations
- Manually verified commands
- Dynamic counting (no magic numbers)
- Data collected on: 2025-10-15

---

**Verification Methodology:**
```bash
# clean-ts-api - source files
cd clean-ts-api-candidate
find src -name "*.ts" -not -name "*.spec.ts" -not -name "*.test.ts" -type f | wc -l
# Result: 181 files

# clean-ts-api - source LOC
find src -name "*.ts" -not -name "*.spec.ts" -not -name "*.test.ts" -type f -exec cat {} \; | wc -l
# Result: 2,510 lines

# nooa-core-engine - files
cd nooa-core-engine
find src -name "*.ts" -type f | wc -l
# Result: 22 files

# nooa-core-engine - LOC
find src -name "*.ts" -type f -exec cat {} \; | wc -l
# Result: 1,920 lines
```

---

*Document generated to clarify questions raised during benchmark analysis.*

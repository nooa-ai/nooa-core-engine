# Changelog

All notable changes to the Nooa Core Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Grammar Evolution

- feat(learning): add rule docker-unpinned-base-image (discovered via #22)

## [1.4.0] - 2025-10-16

### Added - Clean Architecture Refactoring & Test Coverage

#### New Validators
- **File Metrics Validator**: Validates file size, test coverage, and documentation
  - `file-size.validator.ts` - Ensures files stay under max LOC threshold
  - `test-coverage.validator.ts` - Enforces test files for production code
  - `documentation.validator.ts` - Requires docs for complex files
  - `class-complexity.validator.ts` - Prevents God Objects
  - `granularity-metric.validator.ts` - Tracks average file granularity
- **Code Pattern Validator**: Detects forbidden keywords and required structures
- **Hygiene Validator**: Consolidated hygiene rules
- **Structure Validator**: Validates required directory structures
- **Dependency Validators**:
  - `circular-dependency.detector.ts` - DFS-based cycle detection
  - `forbidden-dependency.checker.ts` - Prevents invalid dependencies
  - `required-dependency.validator.ts` - Enforces required connections

#### New Helpers
- **String Similarity Helper**: Jaro-Winkler algorithm implementation
- **Rule Extractor Helper**: Extracts and transforms grammar rules
- **Role Matcher Helper**: Matches files to architectural roles
- **Violation Deduplicator Helper**: Removes duplicate violations
- **File Content Helper**: Reads and processes file contents

#### New Adapters (ISP & DIP Compliance)
- **NodeCliAdapter**: Implements `IProcessArgsProvider`, `IProcessExitHandler`, `IProcessEnvProvider`
- **EnvDisplayConfigAdapter**: Implements `IDisplayConfigProvider`
- **NodeFileSystemAdapter**: Implements `IFileReader`, `IFileExistenceChecker`, `IDirectoryLister`

#### Presentation Layer
- **CLI Violation Presenter**: Formats and displays analysis results
- **Presentation Components**:
  - `violation-formatter.component.ts` - Formats violation output
  - `metrics-formatter.component.ts` - Formats metrics display
  - `summary-formatter.component.ts` - Formats summary statistics
  - `error-formatter.component.ts` - Formats error messages
  - `usage.component.ts` - CLI usage instructions
- **Presentation Protocols**: Interface Segregation Principle (ISP)
  - `IDisplayConfigProvider` - Display configuration
  - `IProcessArgsProvider` - CLI arguments
  - `IProcessExitHandler` - Process exit handling

#### Validation Layer
- **CLI Args Validation**: Input validation for CLI arguments
- **Validation Protocols**: `IValidation`, `CheckResult`, `ValidationError`

#### Infrastructure
- **Schema Validator**: JSON Schema validation with AJV
- **Semantic Grammar Validator**: Grammar semantic validation
- **YAML Parser Helper**: YAML parsing and transformation
- **Grammar Transformer Helper**: Transforms YAML to domain models
- **Rule Transformers**: Specialized transformers for hygiene and metrics rules
- **Symbol Extractor Helper**: Extracts TypeScript symbols using ts-morph

#### Factories
- **CLI Controller Factory**: Composition root for CLI layer
- **Analyze Codebase Factory**: Use case factory with all dependencies

### Changed
- **Architecture**: Complete refactoring following Clean Architecture principles
  - **Domain Layer**: Pure types with discriminated unions (7 rule types)
  - **Data Layer**: Use case simplified from 1494 LOC → 300 LOC
  - **Infrastructure Layer**: Segregated responsibilities with helpers
  - **Presentation Layer**: New CLI components and presenter
  - **Validation Layer**: New layer for input validation
- **Dependency Injection**: Applied DIP throughout the codebase
- **Interface Segregation**: Applied ISP with focused interfaces
- **Use Case**: `AnalyzeCodebaseUseCase` drastically simplified
  - Extracted validators into dedicated classes
  - Extracted helpers for reusable logic
  - Reduced complexity and improved testability
- **Repository**: `YamlGrammarRepository` refactored
  - Extracted YAML parsing to helper
  - Extracted grammar transformation to helper
  - Added schema and semantic validation

### Fixed
- **Test Coverage**: Achieved comprehensive test coverage
  - 29 new test files added
  - All validators covered
  - All helpers covered
  - All adapters covered
  - All presenters covered
  - All factories covered
- **Architectural Violations**: Fixed all violations found by Nooa itself
  - Eliminated direct `fs` module usage (replaced with adapters)
  - Applied ISP to all interfaces
  - Applied DIP with proper abstractions
  - Reduced file sizes (average 87.3 LOC → <20 LOC target)

### Documentation
- Added `PROGRESS_REPORT.md` - Detailed refactoring progress
- Added `docs/AI_NOTE_REVOLUTION.md` - AI-assisted development philosophy
- Added `docs/BIGOH_ONE_ITERATION.md` - Single-pass refactoring approach
- Added `nooa-violations-full.txt` - Complete violation report
- Added `nooa.schema.json` - JSON Schema for grammar validation

### Testing
- **New Test Files** (29 total):
  - `cli-controller.factory.spec.ts`
  - `analyze-codebase.factory.spec.ts`
  - `cli-violation.presenter.spec.ts`
  - `cli.controller.spec.ts`
  - All component specs (violation, metrics, summary, error, usage)
  - All validator specs (file-metrics, code-pattern, file-size, documentation)
  - All helper specs (string-similarity, rule-extractor, role-matcher, violation-deduplicator, file-content)
  - All adapter specs (node-cli, env-display-config, node-file-system)
  - `cli-args-validation.spec.ts`

### Performance
- **Use Case Complexity**: Reduced from O(N³) to O(N²) in some validations
- **File Granularity**: Working towards <20 LOC average per file
- **Maintainability**: Drastically improved through SRP and ISP

---

## [1.2.0] - 2025-01-14

### Added - Code Hygiene Features

#### Synonym Detection (`find_synonyms`)
- **Feature**: Detects classes with suspiciously similar names using Jaro-Winkler algorithm
- **Use Case**: Prevents code duplication by identifying files like `UserCreator` and `CreateUserUseCase` that might be duplicate implementations
- **Implementation**:
  - Jaro-Winkler distance algorithm for string similarity calculation
  - Smart name normalization (removes common suffixes: `usecase`, `impl`, `adapter`, etc.)
  - Thesaurus support for synonym groups (e.g., `Creator`, `Generator`, `Builder`)
  - Configurable similarity threshold (0.0-1.0)
- **Grammar Syntax**:
  ```yaml
  - name: "Detect-Duplicates"
    severity: warning
    for:
      role: USE_CASE
    options:
      similarity_threshold: 0.85
      thesaurus:
        - [Creator, Generator, Builder]
    rule: "find_synonyms"
  ```
- **Documentation**: `docs/HYGIENE_RULES.md`

#### Unreferenced Code Detection (`detect_unreferenced`)
- **Feature**: Detects zombie files (not imported by any other file)
- **Use Case**: Identifies dead code that can be safely removed
- **Implementation**:
  - Reverse dependency graph analysis
  - Counts incoming references for each file
  - Configurable ignore patterns for entry points and barrel exports
  - O(N) complexity
- **Grammar Syntax**:
  ```yaml
  - name: "Detect-Zombie-Files"
    severity: info
    for:
      role: ALL
    options:
      ignore_patterns:
        - "^src/main/server\\.ts$"
        - "/index\\.ts$"
    rule: "detect_unreferenced"
  ```
- **Documentation**: `docs/HYGIENE_RULES.md`

### Changed
- **Type System**: Extended `ArchitecturalRuleModel` discriminated union to include `SynonymDetectionRule` and `UnreferencedCodeRule`
- **YAML Parser**: Updated to parse and validate hygiene rules
- **Use Case**: `AnalyzeCodebaseUseCase` now includes two new validation methods:
  - `validateSynonyms()` - O(N²) for symbols in each role
  - `detectUnreferencedCode()` - O(N) for all symbols
- **Grammar File**: `nooa.grammar.yaml` updated with hygiene rules demonstrating dogfooding
- **README.md**: Added hygiene features section with examples
- **Package Description**: Updated to "Architectural Grammar Validator & Code Hygiene Guardian"

### Documentation
- Added `docs/HYGIENE_RULES.md` - Comprehensive guide to code hygiene features
- Updated `docs/V1.1_FEATURES.md` to include v1.2 features
- Updated `README.md` with hygiene rules syntax and examples

---

## [1.1.0] - 2025-01-13

### Added - Advanced Architectural Validation

#### Circular Dependency Detection
- **Feature**: Detects circular dependencies using DFS algorithm
- **Implementation**: Depth-First Search with WHITE/GRAY/BLACK states
- **Complexity**: O(V + E)
- **Grammar Syntax**:
  ```yaml
  - name: "No-Circular-Dependencies"
    severity: error
    from:
      role: ALL
    to:
      circular: true
    rule: "forbidden"
  ```
- **Documentation**: `docs/CIRCULAR_DEPENDENCY_DETECTION.md`

#### Required Dependencies
- **Feature**: Enforces that specific architectural connections must exist
- **Use Case**: Ensures use cases implement contracts, adapters implement protocols
- **Grammar Syntax**:
  ```yaml
  - name: "Use-Cases-Must-Implement-Contracts"
    severity: error
    from:
      role: USE_CASE_IMPL
    to:
      role: USE_CASE_CONTRACT
    rule: "required"
  ```
- **Documentation**: `docs/REQUIRED_DEPENDENCIES.md`

#### Naming Pattern Validation
- **Feature**: Validates file paths follow naming conventions
- **Use Case**: Ensures consistent naming (e.g., `*.usecase.ts`, `*.adapter.ts`)
- **Grammar Syntax**:
  ```yaml
  - name: "UseCase-Files-Follow-Convention"
    severity: warning
    for:
      role: USE_CASE
    pattern: "\\.usecase\\.ts$"
    rule: "naming_pattern"
  ```

#### Advanced Syntax
- **`role: ALL` Meta-Role**: Matches any role in the codebase
- **Array Roles**: Support for multiple acceptable roles `[ROLE1, ROLE2]`

### Changed
- **Type System**: Introduced discriminated union for `ArchitecturalRuleModel = DependencyRule | NamingPatternRule`
- **Validation Flow**: Ordered validation (circular → required → naming → forbidden)
- **Grammar Version**: Updated to `version: 1.1`

### Documentation
- Added `docs/V1.1_FEATURES.md` - Summary of all v1.1 features
- Added `docs/DOGFOODING_PHILOSOPHY.md` - Philosophy of self-validation
- Updated `nooa.grammar.yaml` with v1.1 features

---

## [1.0.0] - 2025-01-12

### Added - Initial Release

#### Core Features
- **Grammar-based Architecture Validation**: Define rules in YAML
- **Clean Architecture Compliance**: Strict layer separation
- **Forbidden Dependencies**: Prevent wrong dependencies
- **Role System**: Map file paths to architectural roles (NOUN, VERB, ADVERB, CONTEXT, COMPOSER)
- **TypeScript Support**: Full ts-morph integration
- **CLI Interface**: Simple command-line tool

#### Architecture
- **Domain Layer**: Pure business models and use case interfaces
- **Data Layer**: Use case implementations and protocols
- **Infrastructure Layer**: ts-morph parser, YAML repository
- **Presentation Layer**: CLI controller
- **Main Layer**: Dependency injection factories

#### Grammar Syntax (v1.0)
```yaml
version: 1.0
language: typescript

roles:
  - name: NOUN
    path: "^src/domain/models"

rules:
  - name: "Domain-Independence"
    severity: error
    from:
      role: NOUN
    to:
      role: INFRASTRUCTURE
    rule: "forbidden"
```

#### Self-Validation
- Nooa validates itself using `nooa.grammar.yaml`
- Dogfooding philosophy: "Use the grammar to build the validator of the grammar"

### Documentation
- `README.md` - Complete project documentation
- `docs/` - Architecture layer explanations

---

## [Unreleased]

### Added
- feat(learning): add rule Test-Pattern-Rule (discovered via #7)

### Planned Features
- Multiple language support (JavaScript, Python, Java)
- Custom role matchers (not just path-based)
- HTML/JSON report generation
- VS Code extension
- Configuration presets for common architectures
- Machine learning-based duplicate detection
- Complexity metrics (cyclomatic, cognitive)
- Architecture evolution tracking

---

## Version Summary

| Version | Date | Key Features |
|---------|------|--------------|
| **1.4.0** | 2025-10-16 | 🏛️ Clean Architecture Refactoring: ISP/DIP compliance, Validators, Helpers, 29 test files |
| **1.2.0** | 2025-01-14 | 🧹 Code Hygiene: Synonym detection, Zombie code detection |
| **1.1.0** | 2025-01-13 | 🔄 Advanced Validation: Circular dependencies, Required dependencies, Naming patterns |
| **1.0.0** | 2025-01-12 | 🏗️ Initial Release: Grammar-based validation, Clean Architecture |

---

## Breaking Changes

### None

All versions maintain backward compatibility:
- ✅ v1.0 grammars work in v1.1
- ✅ v1.1 grammars work in v1.2
- ✅ v1.2 grammars work in v1.4
- ✅ New features are opt-in

---

## Migration Guide

### From v1.0 to v1.1
No changes required. Optionally add:
- Circular dependency detection
- Required dependency rules
- Naming pattern rules

### From v1.1 to v1.2
No changes required. Optionally add:
- Synonym detection rules
- Unreferenced code detection rules

### From v1.2 to v1.4
No changes required. Internal refactoring only:
- All grammar syntax remains compatible
- No API changes for end users
- Improved architecture and test coverage
- Better maintainability and extensibility

---

## Contributors

- Architecture: Inspired by Clean Architecture (Robert C. Martin, Rodrigo Manguinho)
- Implementation: Dogmatic Clean Architecture approach

---

## License

MIT License - See LICENSE file for details

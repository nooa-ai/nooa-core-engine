# Nooa Core Engine

> Architectural Grammar Validator for TypeScript Projects

Nooa Core Engine is a powerful tool that analyzes TypeScript codebases and validates them against a formal architectural grammar, inspired by Clean Architecture principles.

## Philosophy

The most important rule: **this codebase is itself a dogmatic example of Clean Architecture** (Rodrigo Manguinho's approach). We use the grammar to build the validator of the grammar. Every layer, every file, and every dependency rigorously follows the rules that the engine itself will eventually validate.

## Features

### Architectural Validation
- **Grammar-based Architecture Validation**: Define architectural rules using a simple YAML grammar
- **Clean Architecture Compliance**: Built following strict Clean Architecture principles
- **Flexible Role System**: Map code paths to architectural roles (NOUN, VERB, ADVERB, etc.)
- **Customizable Rules**: Define forbidden, allowed, or required dependencies
- **Circular Dependency Detection**: Automatic detection of dependency cycles
- **Required Dependencies**: Enforce that specific architectural connections exist

### Code Hygiene (v1.2+)
- **Synonym Detection**: Find classes with suspiciously similar names (potential duplicates)
- **Zombie Code Detection**: Identify files not imported anywhere (dead code)
- **Thesaurus Support**: Smart name normalization for better duplicate detection

### Technical
- **TypeScript Support**: Full support for TypeScript codebases using ts-morph
- **CLI Interface**: Easy-to-use command-line interface
- **Self-Validating**: Nooa validates itself using its own grammar

## Project Structure

```
src/
├── domain/              # Enterprise Business Rules (innermost layer)
│   ├── models/          # Pure entities and types
│   └── usecases/        # Use case interfaces (contracts)
│
├── data/                # Application Business Rules
│   ├── protocols/       # Interface definitions for infrastructure
│   └── usecases/        # Use case implementations
│
├── infra/               # Frameworks & Drivers (outermost layer)
│   ├── parsers/         # Code parsing implementations (ts-morph)
│   └── repositories/    # Data access implementations (YAML)
│
├── presentation/        # Interface Adapters
│   └── controllers/     # CLI controller
│
└── main/                # Composition Root
    ├── factories/       # Dependency injection factories
    └── server.ts        # Application entry point
```

### Dependency Rules

Following Clean Architecture, dependencies point inward:

- **Domain** → No dependencies (pure business logic)
- **Data** → Depends on Domain only
- **Infra** → Implements Data protocols
- **Presentation** → Depends on Domain interfaces
- **Main** → Knows about all layers (composition root)

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### 1. Create a Grammar File

Create a `nooa.grammar.yaml` file in your project root:

```yaml
version: 1.0
language: typescript

roles:
  - name: NOUN
    path: "^src/domain/models"

  - name: VERB_CONTRACT
    path: "^src/domain/usecases"

  - name: VERB_IMPLEMENTATION
    path: "^src/data/usecases"

rules:
  - name: "Domain-Independence"
    severity: error
    comment: "Domain must not depend on outer layers"
    from:
      role: [NOUN, VERB_CONTRACT]
    to:
      role: [VERB_IMPLEMENTATION]
    rule: "forbidden"
```

See the root `nooa.grammar.yaml` file for a complete, working example with all v1.1 features.

### 2. Run the Analysis

```bash
# Analyze a project
npm start <project-path>

# Or using the built version
node dist/main/server.js <project-path>
```

### 3. Interpret Results

The tool will output:
- ✅ Success message if no violations found
- ❌ List of violations grouped by severity (error, warning, info)
- Exit code 0 for success, 1 for errors

## Grammar File Format

### Roles

Roles define architectural layers based on file paths:

```yaml
roles:
  - name: ROLE_NAME
    path: "regex-pattern"
    description: "Optional description"
```

### Rules

Rules define dependency constraints and code hygiene checks:

#### Dependency Rules

```yaml
rules:
  - name: "Rule-Name"
    severity: error | warning | info
    comment: "Optional explanation"
    from:
      role: SOURCE_ROLE  # or [ROLE1, ROLE2]
    to:
      role: TARGET_ROLE  # or [ROLE1, ROLE2]
    rule: forbidden | allowed | required
```

**Rule Types:**
- `forbidden`: Dependencies from → to are violations
- `allowed`: Dependencies from → to are permitted
- `required`: Dependencies from → to must exist

#### Hygiene Rules (v1.2+)

**Synonym Detection**:
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

**Zombie Code Detection**:
```yaml
  - name: "Detect-Zombie-Files"
    severity: info
    for:
      role: ALL
    options:
      ignore_patterns:
        - "^src/main/server\\.ts$"
    rule: "detect_unreferenced"
```

See `docs/HYGIENE_RULES.md` for complete documentation.

## Architecture Layers Explained

### Domain Layer (Innermost)

**Purpose**: Pure business logic, independent of any framework or external concern.

**Contains**:
- `models/`: Type definitions and entities
- `usecases/`: Use case interfaces (contracts)

**Rules**:
- No dependencies on outer layers
- No framework imports
- Pure TypeScript types and interfaces

### Data Layer

**Purpose**: Application business logic that orchestrates the domain.

**Contains**:
- `protocols/`: Interfaces for infrastructure dependencies
- `usecases/`: Use case implementations

**Rules**:
- Depends on Domain interfaces
- Depends on Data protocols (abstractions)
- Never depends on concrete Infrastructure implementations

### Infrastructure Layer

**Purpose**: Technical implementations and framework integrations.

**Contains**:
- `parsers/`: Code parsing implementations (ts-morph)
- `repositories/`: Data storage implementations (file system, YAML)

**Rules**:
- Implements Data protocols
- Contains all external library usage
- Can depend on any layer (outermost)

### Presentation Layer

**Purpose**: Interface adapters that handle external communication.

**Contains**:
- `controllers/`: CLI, API, or UI controllers

**Rules**:
- Depends on Domain use case interfaces
- Formats input/output for external systems
- Contains no business logic

### Main Layer (Composition Root)

**Purpose**: Dependency injection and application bootstrapping.

**Contains**:
- `factories/`: Dependency injection factories
- `server.ts`: Application entry point

**Rules**:
- Knows about all layers
- Wires dependencies together
- Contains no business logic

## Self-Validation

To validate that Nooa Core Engine itself follows Clean Architecture:

```bash
# Copy the example grammar to the root
cp examples/nooa.grammar.yaml .

# Run self-analysis
npm start .
```

You should see: ✅ No architectural violations found!

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode (with ts-node)
npm run dev <project-path>
```

## Testing Against Example Projects

You can test the engine against example projects with intentional violations:

```bash
# Create a test project with violations
# Then analyze it
npm start ./path/to/test-project
```

## Future Enhancements

- Multiple language support (JavaScript, Python, Java, etc.)
- Custom role matchers (not just path-based)
- HTML/JSON report generation
- VS Code extension integration
- Configuration presets for common architectures
- Machine learning-based duplicate detection
- Complexity metrics (cyclomatic complexity, cognitive complexity)
- Architecture evolution tracking over time

## Contributing

Contributions must follow the same architectural principles demonstrated in this project:
- Strict adherence to Clean Architecture
- Proper separation of concerns
- Dependency Inversion Principle
- No business logic in outer layers

## License

MIT

## Credits

Inspired by:
- Clean Architecture by Robert C. Martin
- Rodrigo Manguinho's Clean Architecture approach
- The concept of architectural "grammar" as a formal validation system

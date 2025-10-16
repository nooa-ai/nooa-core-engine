# 🧠 Nooa Continuous Learning System

## Overview

Nooa implements a **self-evolving architecture validation system** using Claude Code for continuous learning, pattern discovery, and grammar evolution. The system operates through three automated workflows that work together to improve Nooa's architectural rules over time.

```
┌─────────────────────────────────────────────────────────────┐
│                NOOA CONTINUOUS LEARNING LOOP                │
└─────────────────────────────────────────────────────────────┘

1. DOGFOOD (Daily + Every Push)
   ↓
   Nooa validates itself → Collects metrics → Tracks trends

2. DISCOVER (Weekly)
   ↓
   Claude analyzes violations → Clusters patterns → Creates insights

3. EVOLVE (When approved)
   ↓
   Claude proposes new rules → Validates via dogfooding → PR created

4. MERGE → Back to step 1 (continuous loop)
```

---

## Workflows

### 1. 🐶 Dogfooding Workflow (`claude-dogfooding.yml`)

**Purpose**: Continuous self-validation to ensure Nooa follows its own architectural rules.

**Triggers**:
- Every push to `main` or `develop`
- Every pull request
- Daily at 3AM UTC
- Manual dispatch

**What it does**:
1. Builds and runs Nooa against itself
2. Extracts violations (errors/warnings)
3. Claude analyzes results and trends
4. Creates **blocking issues** if errors detected
5. Tracks metrics over time:
   - Error-free streak (days)
   - Violation trends (last 30 days)
   - Refactoring velocity
6. Stores data in `.nooa/dogfooding/`

**Success Criteria**:
- ✅ **0 errors** = PASS (merge allowed)
- ❌ **>0 errors** = FAIL (blocks merge)
- 🟡 **Warnings** = tracked but don't block

**Example Output**:
```
🐶 Dogfooding Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PASSING

Metrics:
  Total Violations: 16
  Errors: 0
  Warnings: 15

Error-free streak: 7 days 🔥
```

---

### 2. 🔍 Learning Discovery Workflow (`claude-learning-discovery.yml`)

**Purpose**: Automated pattern discovery through violation clustering.

**Triggers**:
- Weekly on Sunday at 2AM UTC
- Manual dispatch with depth selection
- High violation count events

**What it does**:
1. Runs Nooa validation
2. Claude performs **pattern clustering**:
   - Groups similar violations (Jaro-Winkler similarity)
   - Identifies anti-patterns (God Objects, missing tests, etc.)
   - Calculates frequency and confidence
3. Creates **learning insight issues** for patterns with:
   - Confidence score >0.8
   - Minimum 5 occurrences
4. Stores patterns in `.nooa/analytics/patterns.json`

**Pattern Discovery Algorithm**:
```typescript
// Pseudo-code
for violation in violations:
  cluster = findSimilarViolations(violation, threshold=0.85)
  if cluster.size >= 5:
    pattern = {
      name: generatePatternName(cluster),
      frequency: cluster.size,
      confidence: calculateConfidence(cluster),
      suggestedRule: proposeRule(cluster)
    }
    if pattern.confidence > 0.8:
      createIssue(pattern, label="learning-insight")
```

**Example Issue Created**:
```markdown
🧠 Learning Insight: God Use Cases Detected

Pattern: Multiple use case files exceed 200 LOC consistently
Frequency: 8 occurrences
Confidence: 0.92
Affected: src/data/usecases/*

Suggested Rule:
- name: "Use-Case-Size-Strict"
  severity: error
  for: { role: VERB_IMPLEMENTATION }
  max_lines: 150
  rule: "file_size"

Evidence: Files with 200+ LOC tend to have mixed responsibilities
and are harder to test in isolation.
```

---

### 3. 🧬 Grammar Evolution Workflow (`claude-learning-evolution.yml`)

**Purpose**: Evolves the grammar by adding approved rules.

**Triggers**:
- When issue labeled `learning-insight-approved`
- Manual dispatch with issue number

**What it does**:
1. Reads approved learning insight issue
2. Extracts proposed rule (YAML format)
3. Claude validates the rule:
   - Checks format compliance
   - Ensures no conflicts
   - Verifies "AI NOTE" comment
4. Adds rule to `nooa.grammar.yaml`
5. Updates `CHANGELOG.md`
6. **Dogfoods the evolved grammar**:
   ```bash
   npm run build
   npm start .  # Must pass with 0 errors
   ```
7. Creates PR with evolved grammar

**PR Created**:
```markdown
🧬 Grammar Evolution: Rule from Learning Insight #42

Source: Automated pattern discovery
Confidence: 0.92
Occurrences: 8 files

Changes:
- Added `Use-Case-Size-Strict` rule to nooa.grammar.yaml
- Updated CHANGELOG.md

Validation:
✅ Nooa validates itself with 0 errors
✅ New rule does not conflict with existing rules
✅ Rule follows grammar format

Closes #42
```

---

## Learning Data Structure

### Dogfooding Data (`.nooa/dogfooding/`)

```json
// validation-2025-10-16_03-00-00.json
{
  "timestamp": "2025-10-16T03:00:00Z",
  "commit": "abc123",
  "branch": "main",
  "violations": 16,
  "errors": 0,
  "warnings": 15,
  "event": "schedule"
}

// metrics.json
{
  "errorFreeStreak": 7,
  "violationTrend": {
    "2025-10-09": 18,
    "2025-10-16": 16  // Improving ↓
  },
  "refactoringVelocity": 2.5,  // violations fixed per week
  "topViolations": [
    { "rule": "File-Size-Warning", "count": 14 },
    { "rule": "Minimum-Test-File-Ratio", "count": 1 }
  ]
}
```

### Pattern Analytics (`.nooa/analytics/`)

```json
// patterns.json
{
  "discoveredAt": "2025-10-16_02-00-00",
  "patterns": [
    {
      "id": "pattern-001",
      "name": "God Use Cases",
      "type": "file_size_violation",
      "frequency": 8,
      "confidence": 0.92,
      "affectedFiles": [
        "src/data/usecases/analyze-codebase.usecase.ts",
        "src/data/usecases/..."
      ],
      "suggestedRule": {
        "name": "Use-Case-Size-Strict",
        "severity": "error",
        "max_lines": 150
      },
      "status": "proposed"
    }
  ]
}
```

---

## Usage

### Enable Learning System

1. **Add GitHub Secret**:
   ```
   Repository Settings > Secrets and variables > Actions
   Add: CLAUDE_CODE_OAUTH_TOKEN = <your-token>
   ```

2. **Workflows run automatically**, but you can trigger manually:
   ```bash
   # Trigger pattern discovery
   gh workflow run claude-learning-discovery.yml

   # Trigger grammar evolution for specific insight
   gh workflow run claude-learning-evolution.yml -f pattern_issue=42
   ```

### Review Learning Insights

```bash
# View discovered patterns
gh issue list --label learning-insight

# Approve a pattern
gh issue edit 42 --add-label learning-insight-approved
# This automatically triggers grammar evolution

# View dogfooding history
cat .nooa/dogfooding/metrics.json
```

### Monitor Dogfooding Status

```bash
# View recent validations
gh run list --workflow=claude-dogfooding.yml

# Check if Nooa is passing
gh run view <run-id>
```

---

## Metrics & KPIs

### Key Performance Indicators

1. **Error-Free Streak**: Days without architectural errors
   - Target: >7 days
   - Alert: <1 day

2. **Violation Trend**: Change in total violations over time
   - Target: Decreasing trend
   - Alert: >20% increase

3. **Pattern Discovery Rate**: New insights per week
   - Healthy: 1-3 patterns/week
   - Too many: >5 (may indicate unstable codebase)

4. **Grammar Evolution Velocity**: Rules added per month
   - Target: 2-4 rules/month
   - Too fast: >8 (may indicate insufficient validation)

5. **Dogfooding Pass Rate**: % of validations passing
   - Target: 100%
   - Critical: <95%

### Dashboard (GitHub Actions Summary)

Every workflow creates a summary visible in Actions tab:

```
🧠 Learning Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dogfooding Status:     ✅ PASSING (0 errors)
Error-Free Streak:     7 days 🔥
Patterns Discovered:   3 this week
Rules Evolved:         1 this month
Violation Trend:       ↓ -12% (improving)

Top Issues:
  1. File-Size-Warning (14 occurrences)
  2. Minimum-Test-File-Ratio (1 occurrence)

Recommendations:
  → Refactor large files >200 LOC (priority: high)
  → Add test coverage for validators (priority: medium)
```

---

## Learning Principles

### 1. Evidence-Based Rules

Every evolved rule must have:
- **Frequency**: >5 occurrences
- **Confidence**: >0.8 score
- **Evidence**: Real violations from dogfooding

### 2. Dogfooding Validation

Before any rule is added:
```bash
# Must pass self-validation
npm start . → 0 errors
```

If new rule breaks Nooa itself, it's rejected.

### 3. Community Review

Humans approve patterns before evolution:
- Label `learning-insight-approved` required
- PR review required before merge
- Allows rejecting false positives

### 4. Backwards Compatibility

- Rules can be added (evolution)
- Rules can be tuned (severity adjustment)
- Rules are **never removed** without deprecation period

### 5. Transparent Learning

All learning data is:
- Stored in git (`.nooa/`)
- Visible in issues/PRs
- Auditable through commit history

---

## Advanced Configuration

### Adjust Discovery Sensitivity

Edit `claude-learning-discovery.yml`:

```yaml
# More sensitive (detects more patterns)
threshold: 0.75  # was 0.85
min_occurrences: 3  # was 5

# Less sensitive (only obvious patterns)
threshold: 0.90
min_occurrences: 10
```

### Custom Learning Prompts

Extend Claude's analysis in any workflow:

```yaml
prompt: |
  Additional instructions:
  - Focus on performance anti-patterns
  - Prioritize security violations
  - Consider framework-specific patterns
```

### Disable Specific Workflows

```yaml
# Add to workflow file
if: false  # Temporarily disable
```

---

## Troubleshooting

### Issue: "Too many learning insights"

**Cause**: Unstable codebase with many violations
**Solution**:
1. Fix critical errors first (dogfooding failures)
2. Increase threshold: `confidence > 0.9`
3. Run discovery less frequently

### Issue: "Grammar evolution PR fails tests"

**Cause**: New rule breaks existing code
**Solution**:
1. Review rule severity (too strict?)
2. Check for conflicts with existing rules
3. Refactor code to comply with new rule

### Issue: "No patterns discovered"

**Cause**: Codebase too clean or threshold too high
**Solution**:
1. Lower confidence threshold: `>0.7`
2. Reduce min occurrences: `>3`
3. Check if dogfooding is running correctly

---

## Future Enhancements

### Planned Features

1. **LLM Semantic Analysis** (v1.7.0)
   - Deep code understanding
   - Business logic leak detection
   - See [architecture proposal](./CONTINUOUS_LEARNING_ARCHITECTURE.md)

2. **Community Rule Marketplace** (v2.0.0)
   - Share discovered patterns
   - Vote on community rules
   - Cross-project learning

3. **Auto-Severity Tuning** (v2.1.0)
   - Adjust severity based on false positive rate
   - Learn from "ignored violations"

4. **Predictive Refactoring** (v2.2.0)
   - Predict which files will violate new rules
   - Suggest refactorings before violations occur

---

## References

- [Clean Architecture Grammar Analysis](./CLEAN_ARCHITECTURE_GRAMMAR_ANALYSIS.md)
- [Test Grammar Analysis](./CLEAN_ARCHITECTURE_TEST_GRAMMAR_ANALYSIS.md)
- [Nooa Grammar](../nooa.grammar.yaml)
- [Whitepaper v1.4.0](./whitepaper-version-1-4-0/WHITEPAPER.md)

---

**🧠 The Nooa Learning System demonstrates that architectural rules can evolve through observation, just like natural language grammar evolves through usage. This is Clean Architecture as a living, learning system.**

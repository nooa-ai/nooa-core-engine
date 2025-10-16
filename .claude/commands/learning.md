---
description: Manage Nooa's continuous learning system (insights, patterns, evolution)
---

You are managing Nooa's continuous learning system.

## Context
Nooa learns from architectural violations through:
- **Discovery**: Weekly pattern analysis
- **Insights**: Discovered patterns as GitHub issues
- **Evolution**: Approved insights become grammar rules

## Commands Available

Ask the user what they want to do:

1. **📊 Status** - View learning system status
2. **🔍 Discover** - Trigger pattern discovery now
3. **✅ Approve** - Approve a learning insight
4. **🧬 Evolve** - Manually trigger grammar evolution
5. **📈 Analytics** - View learning metrics

---

### 1. Status
```bash
echo "## 🧠 Learning System Status"
echo ""
echo "### Insights"
gh issue list --label learning-insight --json number,title,labels | \
  jq -r '.[] | "- #\(.number): \(.title) [\(.labels[].name | select(. == "learning-insight-approved") // "pending")]"'
echo ""
echo "### Evolution PRs"
gh pr list --label learning-evolution --json number,title,state
echo ""
echo "### Recent Workflows"
gh run list --workflow=claude-learning-discovery.yml --limit 3
```

### 2. Discover Patterns
```bash
echo "🔍 Triggering pattern discovery..."
gh workflow run claude-learning-discovery.yml -f analysis_depth=medium
echo "✅ Started! Monitor: gh run watch"
```

### 3. Approve Insight
```bash
# List pending
gh issue list --label learning-insight --json number,title
# Ask for number
read -p "Issue number to approve: " issue_num
gh issue edit $issue_num --add-label learning-insight-approved
echo "✅ Approved! Evolution workflow will start automatically"
```

### 4. Trigger Evolution
```bash
# Ask for issue number
read -p "Learning insight issue number: " issue_num
gh workflow run claude-learning-evolution.yml -f pattern_issue=$issue_num
echo "✅ Grammar evolution started for issue #$issue_num"
echo "Watch: gh run list --workflow=claude-learning-evolution.yml"
```

### 5. Analytics
```bash
echo "## 📈 Learning Analytics"
echo ""
echo "### Dogfooding Metrics"
cat .nooa/dogfooding/metrics.json 2>/dev/null || echo "No metrics yet"
echo ""
echo "### Pattern Analytics"
cat .nooa/analytics/patterns.json 2>/dev/null || echo "No patterns yet"
echo ""
echo "### Violation Trends"
ls -la .nooa/dogfooding/validation-*.json | tail -5
```

---

## Pattern Types Supported

Nooa's continuous learning can discover and evolve these rule types:

### 1. Architectural Patterns (`forbidden`/`required`)
Dependency rules between layers:
```yaml
- name: "Domain-Independence"
  from: { role: NOUN }
  to: { role: ADVERB_CONCRETE }
  rule: "forbidden"
```

### 2. Business Logic Anti-Patterns (`forbidden_patterns`)
Regex-based code pattern detection:
```yaml
- name: "No-Float-For-Money-Calculations"
  severity: error
  from: { role: ALL }
  contains_forbidden:
    - "(price|cost|amount)\\s*[\\*\\+\\-\\/].*\\b(parseFloat|Float)\\b"
  rule: "forbidden_patterns"
  comment: "AI NOTE: [detailed explanation]"
```

**Common business logic patterns:**
- Money calculations with floats
- Percentage calculation errors
- Timezone-naive datetime usage
- Email regex validation
- Division by zero risks
- Unsafe type coercion

### 3. Code Quality Patterns (`forbidden_keywords`)
Simple keyword detection:
```yaml
- name: "No-Console-Log"
  from: { role: ALL }
  contains_forbidden: ["console.log", "debugger"]
  rule: "forbidden_keywords"
```

### 4. Naming Conventions (`naming_pattern`)
File naming rules:
```yaml
- name: "UseCase-Files-Follow-Convention"
  for: { role: VERB_IMPLEMENTATION }
  pattern: "(\\.usecase\\.ts|/index\\.ts)$"
  rule: "naming_pattern"
```

### 5. Size Limits (`file_size`)
File complexity rules:
```yaml
- name: "File-Size-Error"
  for: { role: ALL }
  max_lines: 200
  rule: "file_size"
```

---

## Example: Proposing a Business Logic Pattern

When creating a learning insight issue for a business logic pattern:

```markdown
## 🔍 Pattern Discovery

**Pattern Name**: `unsafe-array-access`
**Severity**: `warning`
**Category**: Business Logic Anti-Pattern

## 📊 Analysis

### Problem
Accessing array elements without bounds checking causes runtime errors.

### Detection Pattern
```regex
\[\s*\d+\s*\](?!.*\b(length|size|check|if)\b)
```

### Frequency
- 23 occurrences across 12 files
- Confidence: 0.92

## 🎯 Proposed Grammar Rule

```yaml
- name: "No-Unsafe-Array-Access"
  severity: warning
  from: { role: ALL }
  contains_forbidden:
    - "\\[\\s*\\d+\\s*\\](?!.*\\b(length|size|check|if)\\b)"
  rule: "forbidden_patterns"
  comment: "AI NOTE: Array access without bounds check..."
```

## ✅ Evidence
- Issue #42 - Array access crash in production
- 23 files affected in last 6 months
- Pattern correlates with 15% of runtime errors
```

---

## Workflow

Based on user choice, execute the corresponding section above and provide clear feedback about:
- What was done
- What will happen next
- How to monitor progress
- Links to relevant issues/PRs

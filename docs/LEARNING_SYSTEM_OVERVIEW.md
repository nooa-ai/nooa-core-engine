# 🧠 Nooa Learning System - Quick Overview

## Sistema Criado

Implementação completa de aprendizado contínuo usando Claude Code Actions:

```
📁 .github/workflows/
  ├── claude-dogfooding.yml          ← 🐶 Validação contínua
  ├── claude-learning-discovery.yml  ← 🔍 Descoberta de padrões
  └── claude-learning-evolution.yml  ← 🧬 Evolução da gramática

📁 .github/ISSUE_TEMPLATE/
  └── learning-insight.md            ← 📋 Template para insights

📁 docs/
  ├── CONTINUOUS_LEARNING.md         ← 📚 Documentação completa
  └── LEARNING_SYSTEM_OVERVIEW.md    ← 📖 Este arquivo
```

---

## 🔄 Como Funciona (3 Workflows)

### 1. 🐶 Dogfooding (Validação Contínua)

**Quando**: A cada push, PR, e diariamente

```bash
npm run build
npm start .

✅ 0 errors → PASS (merge permitido)
❌ >0 errors → FAIL (bloqueia merge)
🟡 warnings → Rastreado (não bloqueia)
```

**Coleta**:
- `.nooa/dogfooding/validation-[timestamp].json`
- Métricas: violations, errors, warnings
- Trends: error-free streak, refactoring velocity

---

### 2. 🔍 Discovery (Descoberta de Padrões)

**Quando**: Semanalmente (domingo 2AM)

**Processo**:
```
Violations → Clustering (Jaro-Winkler) → Patterns
```

**Se encontrar padrão recorrente** (≥5x, confidence >0.8):
```bash
gh issue create --label learning-insight
```

**Issue criada**:
```markdown
🧠 Learning Insight: God Use Cases

Frequência: 8 ocorrências
Confiança: 0.92
Regra sugerida: Use-Case-Size-Strict (max 150 LOC)
```

---

### 3. 🧬 Evolution (Evolução da Gramática)

**Quando**: Issue recebe label `learning-insight-approved`

**Processo**:
```bash
1. Lê issue com regra proposta
2. Valida formato YAML
3. Adiciona a nooa.grammar.yaml
4. Atualiza CHANGELOG.md
5. Dogfoods: npm start . (deve passar!)
6. Cria PR para review
```

**PR criada**:
```markdown
🧬 Grammar Evolution: Rule from Learning Insight #42

✅ Nooa validates itself with 0 errors
✅ New rule does not conflict
```

---

## 🚀 Quick Start

### 1. Adicionar Secret

```bash
# GitHub Repository Settings > Secrets
CLAUDE_CODE_OAUTH_TOKEN = <seu-token>
```

### 2. Workflows Ativos Automaticamente

- ✅ Dogfooding: roda em todo push/PR
- ✅ Discovery: roda domingo 2AM
- ✅ Evolution: roda quando issue aprovada

### 3. Aprovar um Insight

```bash
# Ver insights descobertos
gh issue list --label learning-insight

# Aprovar
gh issue edit 42 --add-label learning-insight-approved

# Aguardar PR automático
gh pr list --label learning-evolution
```

---

## 📊 Dados Gerados

### Dogfooding Data

```json
// .nooa/dogfooding/validation-2025-10-16T03:00:00Z.json
{
  "violations": 16,
  "errors": 0,
  "warnings": 15,
  "commit": "abc123"
}

// .nooa/dogfooding/metrics.json
{
  "errorFreeStreak": 7,
  "violationTrend": { "2025-10-16": 16 },
  "topViolations": [...]
}
```

### Pattern Analytics

```json
// .nooa/analytics/patterns.json
{
  "patterns": [
    {
      "name": "God Use Cases",
      "frequency": 8,
      "confidence": 0.92,
      "suggestedRule": { ... }
    }
  ]
}
```

---

## 🎯 Exemplo Real de Uso

### Semana 1: Discovery

```
[Domingo 2AM]
🔍 Discovery workflow executa
└─→ Detecta: 8 arquivos use case com >200 LOC
└─→ Cria issue #42: "🧠 Learning Insight: God Use Cases"
```

### Semana 2: Review

```
[Terça]
Desenvolvedor revisa issue #42
└─→ Aprova: gh issue edit 42 --add-label learning-insight-approved
```

### Semana 2: Evolution

```
[Terça - automático]
🧬 Evolution workflow executa
├─→ Adiciona regra Use-Case-Size-Strict
├─→ Dogfoods: npm start . → ✅ 0 errors
└─→ Cria PR #43
```

### Semana 3: Merge

```
[Quarta]
PR #43 revisado e mergeado
└─→ Próximo dogfooding usa nova regra!
```

---

## 📈 Métricas Rastreadas

| Métrica | Target | Alerta |
|---------|--------|--------|
| Error-free streak | >7 dias | <1 dia |
| Violation trend | Decrescente | >20% aumento |
| Pattern discovery | 1-3/semana | >5/semana |
| Evolution velocity | 2-4 rules/mês | >8/mês |
| Dogfooding pass rate | 100% | <95% |

---

## 🔧 Comandos Úteis

```bash
# Verificar status do dogfooding
gh run list --workflow=claude-dogfooding.yml --limit 5

# Ver insights descobertos
gh issue list --label learning-insight

# Aprovar insight
gh issue edit 42 --add-label learning-insight-approved

# Disparar discovery manualmente
gh workflow run claude-learning-discovery.yml

# Ver dados locais
cat .nooa/dogfooding/metrics.json
cat .nooa/analytics/patterns.json

# Ver histórico de violations
ls -la .nooa/dogfooding/validation-*.json
```

---

## 🎨 Dashboards (GitHub Actions)

Cada workflow gera um summary visual:

### Dogfooding Summary

```
🐶 Dogfooding Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PASSING

Metrics:
  Total Violations: 16
  Errors: 0
  Warnings: 15

Error-free streak: 7 days 🔥
```

### Discovery Summary

```
🧠 Pattern Discovery
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patterns Found: 3

1. God Use Cases (8x, confidence: 0.92)
2. Missing Tests (12x, confidence: 0.95)
3. Validation in Controllers (5x, confidence: 0.85)

→ 3 learning insight issues created
```

### Evolution Summary

```
🧬 Grammar Evolution
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Rule added successfully

Rule: Use-Case-Size-Strict
Source: Learning Insight #42
Validation: ✅ Dogfooding passed

→ PR #43 created for review
```

---

## 🔐 Privacidade

**O que é coletado**:
- ✅ Métricas agregadas (violations count)
- ✅ Regras violadas (rule names)
- ✅ Trends históricos

**O que NÃO é coletado**:
- ❌ Código fonte
- ❌ Nomes de arquivos sensíveis
- ❌ Dados do desenvolvedor
- ❌ IP addresses

Todos os dados ficam no próprio repositório (`.nooa/`).

---

## 🏆 Benefícios

### Para o Projeto

1. **Auto-correção**: Regras evoluem baseadas em evidências reais
2. **Qualidade crescente**: Violations diminuem ao longo do tempo
3. **Documentação viva**: Insights documentam decisões arquiteturais

### Para a Equipe

1. **Menos code review manual**: Padrões detectados automaticamente
2. **Aprendizado contínuo**: Time aprende com insights descobertos
3. **Decisões baseadas em dados**: Não em opiniões

### Para o Nooa

1. **Dogfooding rigoroso**: Nooa valida-se continuamente
2. **Community-driven**: Regras vêm de uso real
3. **Evidence-based**: Cada regra tem métricas de suporte

---

## 🔮 Roadmap

### v1.5.0 (Atual) ✅
- [x] Dogfooding workflow
- [x] Pattern discovery
- [x] Grammar evolution
- [x] Analytics storage

### v1.6.0 (Next)
- [ ] Severity auto-tuning
- [ ] False positive tracking
- [ ] Cross-project learning

### v1.7.0 (Future)
- [ ] LLM semantic analysis
- [ ] Predictive refactoring
- [ ] Community rule marketplace

---

## 📚 Documentação Completa

- [Continuous Learning](./CONTINUOUS_LEARNING.md) - Documentação detalhada
- [Clean Architecture Grammar](./CLEAN_ARCHITECTURE_GRAMMAR_ANALYSIS.md)
- [Test Grammar](./CLEAN_ARCHITECTURE_TEST_GRAMMAR_ANALYSIS.md)

---

## 🚨 Troubleshooting

**Issue: Muitos insights sendo criados**
```bash
# Aumentar threshold de confiança
# Em claude-learning-discovery.yml:
confidence_threshold: 0.9  # era 0.8
```

**Issue: PR de evolution falha em testes**
```bash
# Revisar severidade da regra proposta
# Pode ser muito estrita para o código atual
```

**Issue: Dogfooding sempre falhando**
```bash
# Prioridade CRÍTICA: corrigir errors
# Violations devem sempre ser 0 errors
gh run list --workflow=claude-dogfooding.yml
```

---

**🧠 Nooa agora aprende continuamente com seu próprio uso. É Clean Architecture como sistema vivo e evolutivo!**

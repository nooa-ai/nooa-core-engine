# Benchmark Candidate: clean-ts-api (Rodrigo Manguinho)

Este diretório contém os resultados do benchmark científico executado no projeto **clean-ts-api** de Rodrigo Manguinho usando o Nooa Core Engine.

## 📁 Projeto Analisado

- **Repositório**: https://github.com/rmanguinho/clean-ts-api
- **Descrição**: API em Node.js com TypeScript seguindo princípios de Clean Architecture, TDD e SOLID
- **Autor**: Rodrigo Manguinho

## 🔬 Metodologia do Benchmark

- **Iterações**: 100 execuções
- **Algoritmo**: Idêntico ao usado no benchmark do nooa-core-engine (rigor científico)
- **Medições**: Tempo de análise, memória, violações arquiteturais
- **Coleta de Dados**: Dinâmica (sem magic numbers)

## 📊 Configuração do Projeto

- **Arquivos TypeScript**: 240
- **Linhas de Código**: 5.853
- **Roles Definidas**: 10
- **Regras na Gramática**: 15

## ⚡ Resultados de Performance (100 iterações)

### Tempo de Análise
- **Mínimo**: 421ms
- **Máximo**: 802ms
- **Média**: 477ms
- **Mediana**: 454ms
- **Desvio Padrão**: ±65ms
- **Variação**: 13.6%

### Tempo Total (Incluindo Inicialização)
- **Mínimo**: 580ms
- **Máximo**: 970ms
- **Média**: 644ms
- **Mediana**: 620ms
- **Desvio Padrão**: ±75ms

### Uso de Memória
- **Mínimo**: 201 MB
- **Máximo**: 235 MB
- **Média**: 227 MB
- **Mediana**: 229 MB
- **Desvio Padrão**: ±7 MB

### Métricas Derivadas
- **Throughput**: ~503 arquivos/segundo
- **Latência**: ~2ms por arquivo
- **Eficiência de Memória**: ~1MB por arquivo

## 🔍 Violações Arquiteturais Detectadas: 190 total

### 🔴 ERROS CRÍTICOS (2)
1. **Dependência Circular** em `src/main/docs/schemas.ts` → `schemas.ts`
   - _"Circular dependencies are the most destructive architectural flaw and must be eliminated"_
2. **Dependência Circular** em `src/main/docs/paths.ts` → `paths.ts`
   - _"Circular dependencies are the most destructive architectural flaw and must be eliminated"_

### 🟡 WARNINGS (24)

#### Adapter Files Follow Convention (9 violações)
Arquivos que não seguem a convenção `.adapter.ts` ou `.repository.ts`:
1. `src/infra/cryptography/bcrypt-adapter.ts`
2. `src/infra/cryptography/jwt-adapter.ts`
3. `src/infra/validators/email-validator-adapter.ts`
4. `src/infra/db/mongodb/account-mongo-repository.ts`
5. `src/infra/db/mongodb/log-mongo-repository.ts`
6. `src/infra/db/mongodb/mongo-helper.ts`
7. `src/infra/db/mongodb/query-builder.ts`
8. `src/infra/db/mongodb/survey-mongo-repository.ts`
9. `src/infra/db/mongodb/survey-result-mongo-repository.ts`

#### UseCase Files Follow Convention (9 violações)
Arquivos que não seguem a convenção `.usecase.ts`:
1. `src/data/usecases/db-add-account.ts`
2. `src/data/usecases/db-add-survey.ts`
3. `src/data/usecases/db-authentication.ts`
4. `src/data/usecases/db-check-survey-by-id.ts`
5. `src/data/usecases/db-load-account-by-token.ts`
6. `src/data/usecases/db-load-answers-by-survey.ts`
7. `src/data/usecases/db-load-survey-result.ts`
8. `src/data/usecases/db-load-surveys.ts`
9. `src/data/usecases/db-save-survey-result.ts`

#### Controller Files Follow Convention (6 violações)
Arquivos que não seguem a convenção `.controller.ts`:
1. `src/presentation/controllers/add-survey-controller.ts`
2. `src/presentation/controllers/load-survey-result-controller.ts`
3. `src/presentation/controllers/load-surveys-controller.ts`
4. `src/presentation/controllers/login-controller.ts`
5. `src/presentation/controllers/save-survey-result-controller.ts`
6. `src/presentation/controllers/signup-controller.ts`

### ℹ️ INFO (164)

#### Detect Zombie Files (164 violações)
Arquivos que não são importados por nenhum outro arquivo (possível código morto):

**Data Protocols (14 arquivos zombie):**
- `src/data/protocols/cryptography/decrypter.ts`
- `src/data/protocols/cryptography/encrypter.ts`
- `src/data/protocols/cryptography/hash-comparer.ts`
- `src/data/protocols/cryptography/hasher.ts`
- `src/data/protocols/db/account/add-account-repository.ts`
- `src/data/protocols/db/account/check-account-by-email-repository.ts`
- `src/data/protocols/db/account/load-account-by-email-repository.ts`
- `src/data/protocols/db/account/load-account-by-token-repository.ts`
- `src/data/protocols/db/account/update-access-token-repository.ts`
- `src/data/protocols/db/log/log-error-repository.ts`
- `src/data/protocols/db/survey/add-survey-repository.ts`
- `src/data/protocols/db/survey/check-survey-by-id-repository.ts`
- `src/data/protocols/db/survey/load-answers-by-survey-repository.ts`
- `src/data/protocols/db/survey/load-survey-by-id-repository.ts`
- `src/data/protocols/db/survey/load-surveys-repository.ts`
- `src/data/protocols/db/survey-result/load-survey-result-repository.ts`
- `src/data/protocols/db/survey-result/save-survey-result-repository.ts`

**Domain Usecases (9 arquivos zombie):**
- `src/domain/usecases/add-account.ts`
- `src/domain/usecases/add-survey.ts`
- `src/domain/usecases/authentication.ts`
- `src/domain/usecases/check-survey-by-id.ts`
- `src/domain/usecases/load-account-by-token.ts`
- `src/domain/usecases/load-answers-by-survey.ts`
- `src/domain/usecases/load-survey-result.ts`
- `src/domain/usecases/load-surveys.ts`
- `src/domain/usecases/save-survey-result.ts`

**Domain Models (4 arquivos zombie):**
- `src/domain/models/account.ts`
- `src/domain/models/authentication.ts`
- `src/domain/models/survey-result.ts`
- `src/domain/models/survey.ts`

**Presentation Protocols (2 arquivos zombie):**
- `src/presentation/protocols/http.ts`
- `src/presentation/protocols/validation.ts`

**Main Adapters (1 arquivo zombie):**
- `src/main/adapters/validators/email-validator-adapter.ts`

**Validation Protocols (1 arquivo zombie):**
- `src/validation/protocols/email-validator.ts`

_E mais 133 outros arquivos não listados aqui por brevidade. Ver relatório completo em `nooa-violations-report.txt`._

## 📈 Comparação com nooa-core-engine

| Métrica | clean-ts-api | nooa-core-engine | Diferença |
|---------|--------------|------------------|-----------|
| **Arquivos** | 240 | 22 | **10.9x maior** |
| **LOC** | 5,853 | 1,920 | **3.0x maior** |
| **Tempo Análise** | 477ms | 409ms | **+16%** |
| **Memória** | 227 MB | 220 MB | **+3%** |
| **Erros** | 2 | 0 | ❌ |
| **Warnings** | 24 | 0 | ⚠️ |
| **Info (Zombies)** | 164 | 11 | 💀 |

> **⚠️ NOTA IMPORTANTE**: A comparação acima pode parecer indicar que o nooa-core-engine tem código menos modular. Para entender a metodologia de contagem e a explicação detalhada das métricas, consulte:
> - 📊 [METRICS_EXPLANATION.md](../METRICS_EXPLANATION.md) (Português)
> - 📊 [METRICS_EXPLANATION.en-us.md](../METRICS_EXPLANATION.en-us.md) (English)
>
> **TL;DR**: Os 240 arquivos do clean-ts-api incluem **181 arquivos fonte + 59 testes**. O nooa-core-engine tem **22 arquivos fonte + 0 testes**. Comparando apenas código-fonte:
> - clean-ts-api: 2,510 LOC em 181 arquivos = **13.9 LOC/arquivo** (excelente granularidade)
> - nooa-core-engine: 1,920 LOC em 22 arquivos = **87.3 LOC/arquivo** (arquivos 6.3x maiores)

## 📄 Arquivos Disponíveis

### Benchmarks
- `benchmark-2025-10-15_22-50-15.json` - Resultado completo de 100 iterações (JSON)
- `benchmark-2025-10-15_22-50-15.md` - Relatório em Markdown
- `latest.json` - Link simbólico para o último benchmark

### Relatórios de Violações
- `nooa-violations-report.txt` - Relatório completo com todas as 190 violações detalhadas (793 linhas)

## 🎯 Conclusões

1. **Escalabilidade do Nooa**: Analisa 10.9x mais arquivos com apenas 16% mais tempo
2. **Dependências Circulares**: 2 problemas críticos detectados que devem ser corrigidos imediatamente
3. **Naming Conventions**: 24 violações indicam falta de consistência no padrão de nomenclatura
4. **Código Morto**: 164 arquivos zombie (68% do total!) representam grande oportunidade de limpeza
5. **Performance**: ~503 arquivos/segundo com uso de memória linear

## 📚 Referências

- Benchmark gerado automaticamente pelo Nooa Core Engine v1.2.0
- Data de execução: 2025-10-15
- Algoritmo de benchmark: Scientific (100 iterations with statistical analysis)

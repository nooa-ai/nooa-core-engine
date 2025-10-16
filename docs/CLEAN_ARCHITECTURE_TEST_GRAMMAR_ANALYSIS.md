# Clean Architecture Test Grammar
## A Formal Linguistic Analysis of Rodrigo Manguinho's Jest Suite

---

## Executive Summary

Esta análise trata a suíte de testes do projeto `clean-ts-api` como um **sistema gramatical formal**. Assim como o código de produção, os testes seguem regras sintáticas e semânticas rígidas que asseguram consistência arquitetural, expressividade e verificabilidade. A suíte é organizada em camadas que espelham a arquitetura limpa (domain, data, infra, presentation, validation, main), cada qual com vocabulário (mocks/spies) e sentenças (specs) específicos.

**Descoberta-chave**: A suíte de testes funciona como uma gramática complementar onde:
- **Specs unitários** = sentenças simples (declarações de verdade sobre um verbo)
- **Mocks/Spies** = advérbios e sujeitos fictícios usados para montar frases de teste
- **Tests de integração** = parágrafos compostos que exercitam a gramática completa (controllers → use cases → infra)
- **Test helpers** = léxico compartilhado

---

## Parte 1: Especificação Formal (BNF)

### 1.1 Gramática completa das specs

```bnf
<test-program> ::= <test-layer>+

<test-layer> ::= <domain-tests>
               | <data-tests>
               | <infra-tests>
               | <presentation-tests>
               | <validation-tests>
               | <main-tests>

<domain-tests> ::= <mock-module>+
<mock-module> ::= "export" <mock-symbol> ("=" | "class") <mock-definition>

<data-tests> ::= <usecase-spec>+
<usecase-spec> ::= "describe(" <quoted-string> "," <spec-block> ")"

<infra-tests> ::= <adapter-spec>+
<presentation-tests> ::= <controller-spec>+
<validation-tests> ::= <validator-spec>+
<main-tests> ::= <integration-spec>+

<spec-block> ::= "() => {" <hook>* <test-case>+ "}"

<hook> ::= "beforeAll(" <async-function> ")"
         | "afterAll(" <async-function> ")"
         | "beforeEach(" <async-function> ")"

<test-case> ::= "test(" <quoted-string> "," <async-arrow-function> ")"
<async-arrow-function> ::= "async" <parameters> "=>" <block>
                         | <parameters> "=>" <block>

<block> ::= "{" <arrange> <act> <assert> "}"

<arrange> ::= (<variable-declaration> | <mock-setup> | <stub-setup>)*
<act> ::= <await-expression>+
<assert> ::= <expect-statement>+

<expect-statement> ::= "expect(" <expression> ")." <matcher> "(" <arguments>? ")"

<matcher> ::= "toBe"
            | "toEqual"
            | "toHaveBeenCalledWith"
            | "toThrow"
            | "toBeInstanceOf"
            | "toBeTruthy"
            | "toBeFalsy"
            | "toHaveLength"
            | "toStrictEqual"
            | ...

<mock-definition> ::= <object-literal>
                    | "class" <identifier> <class-body>
                    | "(" <parameters> ")" "=>" <expression>
```

### 1.2 Gramática de dependências (Hierarquia de Chomsky nível 2 - livre de contexto)

```bnf
<test-dependency-rule> ::= <layer> "→" <layer>
                         | <layer> "↛" <layer>  /* proibido */

<layer> ::= DomainTests
          | DataTests
          | InfraTests
          | PresentationTests
          | ValidationTests
          | MainTests
          | ProductionCode

<allowed> ::= DomainTests → DomainMocks
            | DataTests → (DataMocks | DomainMocks)
            | PresentationTests → (PresentationMocks | DomainMocks)
            | MainTests → (PresentationTests | InfraTests | SetupFactories)
            | ValidationTests → ValidationMocks
            | InfraTests → (InfraAdapters | MongoHelper)

<forbidden> ::= ProductionCode ↛ TestFiles
              | DomainTests ↛ InfraAdapters  /* isolamento */
              | DataTests ↛ PresentationControllers
```

### 1.3 Regras padronizadas (pattern grammar)

```bnf
/* TEST-001: AAA (Arrange-Act-Assert) */
<valid-test-case> ::= <arrange> <act> <assert>

/* TEST-002: SUT Factory */
<sut-factory> ::= "const makeSut =" "() => {" <arrange> "return { sut," <dependencies> " }}" 

/* TEST-003: Spy Pattern */
<spy-class> ::= "class" <identifier> "{" <method-override>+ "}"
<method-override> ::= <method-name> "(" <params> ")" "{" "this.calls.push(" <params> ")" "return" <stubbed-value> "}"

/* TEST-004: Integration Setup */
<integration-setup> ::= "beforeAll(async () => {" <app-setup> "})"
```

---

## Parte 2: Análise linguística

### 2.1 Partes do discurso aplicadas aos testes

| Elemento de teste                     | Função linguística              | Paralelo natural | Exemplo                                                  |
|--------------------------------------|---------------------------------|------------------|----------------------------------------------------------|
| **Mocks/Stubs** (`tests/**/mocks`)   | Vocabulário fictício (substantivos/verbo auxiliares) | Palavras inventadas para cenários hipotéticos | `AuthenticationSpy`, `mockSurveyResult()`                |
| **makeSut**                          | Construção de sujeito (quem age) | Sujeito da frase | `const { sut } = makeSut()`                              |
| **Act (handle, add, auth)**          | Verbo principal                 | Ação             | `await sut.handle(request)`                              |
| **Expect**                           | Predicado/Conclusão             | Resultado da sentença | `expect(authenticationSpy.params).toEqual(...)`      |
| **Hooks (beforeAll, afterAll)**      | Advérbios temporais             | Marcadores de tempo | `beforeEach(async () => { ... })`                      |
| **describe(...)**                    | Contexto semântico (parágrafo)  | Tópico           | `describe('Login Controller', () => { ... })`            |
| **test(...)**                        | Sentenças declarativas          | Frases completas | `test('Should return 401 if invalid credentials', ...)` |

### 2.2 Estrutura de frase (AAA como oração SVO)

```typescript
test('Should return 401 if invalid credentials', async () => {
  // A: sujeito e cenário (Arrange)
  const { sut, authenticationSpy } = makeSut()
  authenticationSpy.result = null

  // A: verbo (Act)
  const httpResponse = await sut.handle(mockRequest())

  // A: predicado/conclusão (Assert)
  expect(httpResponse).toEqual(unauthorized())
})
```

**Análise linguística**:
- Sujeito implícito: `sut` (controller testado) — provém de fábrica `makeSut`.
- Verbo: `handle` (ação sob teste).
- Objeto: `mockRequest()` (entrada).
- Predicado: `unauthorized()` — resultado esperado.

### 2.3 Árvore sintática de dependências (exemplo: `tests/presentation/controllers/login-controller.spec.ts`)

```
Spec (Login Controller)
│
├─ Vocabulário (imports)
│  ├─ Presentation Helpers (badRequest, ok, unauthorized)
│  ├─ Error Types (MissingParamError)
│  ├─ Mocks (AuthenticationSpy, ValidationSpy)
│  ├─ Domain Mocks (throwError)
│
├─ makeSut (constrói sujeito)
│  └─ sut = LoginController(AuthenticationSpy, ValidationSpy)
│
├─ Casos de teste
│  ├─ "Should call Authentication with correct values"
│  │   ├─ Arrange: sut, request
│  │   └─ Assert: expect(authenticationSpy.params)...
│  ├─ "Should return 401 if invalid credentials"
│  └─ ...
│
└─ Vocabulário auxiliar
   └─ mockRequest()
```

---

## Parte 3: Catálogo de padrões com explicações gramaticais

### Padrão TEST-001: AAA disciplinado

**Regex**:
```regex
test\\('(Should|Deve)[\\s\\S]*?\\)\\s*=>\\s*\\{[\\s\\S]*?const\\s+[a-zA-Z].*?=\\s*makeSut\\(\\)[\\s\\S]*?await\\s+sut\\.[\\s\\S]*?expect\\(
```

**Função**: Garante sentenças com estrutura `Sujeito → Verbo → Predicado`. Ausência de uma das partes implica frase incompleta.

**Violação**:
```typescript
test('Should call Authentication', async () => {
  const { sut } = makeSut()
  // ❌ Falta Act/Assert
})
```

**Correção**: adicionar ação (`await sut.handle(...)`) e verificação (`expect(...)`).

### Padrão TEST-002: Fábrica do SUT

**Exemplo** (`tests/presentation/controllers/login-controller.spec.ts:18`):
```typescript
const makeSut = (): SutTypes => {
  const authenticationSpy = new AuthenticationSpy()
  const validationSpy = new ValidationSpy()
  const sut = new LoginController(authenticationSpy, validationSpy)
  return { sut, authenticationSpy, validationSpy }
}
```

**Explicação**: semelhante a montar sujeito composto (controller + dependências) antes da frase. Permite reuso e clareza.

### Padrão TEST-003: Spies e Stubs

**Exemplo** (`tests/presentation/mocks/authentication-spy.ts`):
```typescript
export class AuthenticationSpy implements Authentication {
  params: Authentication.Params
  result = { accessToken: faker.datatype.uuid(), name: faker.name.findName() }

  async auth(params: Authentication.Params): Promise<Authentication.Result> {
    this.params = params
    return this.result
  }
}
```

**Linguística**: spy registra advérbio (como o verbo foi usado) para posterior verificação na frase (`expect(authenticationSpy.params)`).

### Padrão TEST-004: Hooks temporais

**Exemplo** (`tests/main/routes/login-routes.test.ts:10`):
```typescript
beforeAll(async () => {
  app = await setupApp()
  await MongoHelper.connect(process.env.MONGO_URL)
})
```

**Função**: estabelece contexto temporal (advérbios “antes de cada frase”). Garante que sentenças subsequentes ocorram com estado consistente.

### Padrão TEST-005: Integração em parágrafos

**Exemplo** (`tests/main/graphql/login.test.ts`):
```typescript
describe('Login GraphQL', () => {
  beforeAll(...)
  afterAll(...)

  test('Should return an Account on valid credentials', async () => {
    await request(app).post('/graphql').send({ query: loginMutation })
    expect(response.status).toBe(200)
  })
})
```

**Analogia**: parágrafo completo com frase introdutória (describe), contexto temporal (hooks) e frases conclusivas (tests).

---

## Parte 4: Pipeline NLP aplicado à suíte

### 4.1 Tokenização

**Processo**: percorrer `tests/**` e mapear tokens semânticos.

| Token                         | Exemplo                                                       |
|------------------------------|---------------------------------------------------------------|
| `LayerToken`                 | `tests/presentation/controllers`                              |
| `SpecToken`                  | `test('Should return 401...', ...)`                           |
| `MockToken`                  | `AuthenticationSpy`                                           |
| `HookToken`                  | `beforeEach(async () => { ... })`                             |
| `MatcherToken`               | `toEqual`, `toHaveBeenCalledWith`, `toThrow`                  |
| `ExternalDependencyToken`    | `faker`, `supertest`, `mongodb`                               |

### 4.2 POS Tagging de testes

Pseudo-algoritmo:

```typescript
function tagTestSymbol(symbol: TestSymbol): TestRole {
  if (symbol.path.includes('tests/domain/mocks')) return 'Lexicon'
  if (symbol.name.startsWith('make') && symbol.kind === 'function') return 'SubjectFactory'
  if (symbol.kind === 'describe') return 'Paragraph'
  if (symbol.kind === 'test') return 'Sentence'
  if (symbol.name === 'expect') return 'Predicate'
  if (symbol.kind === 'hook') return 'TemporalAdverb'
  return 'Unknown'
}
```

### 4.3 Parsing de dependências

**Exemplo** (`tests/data/usecases/db-authentication.spec.ts`):

```
Sentence: "Should call LoadAccountByEmailRepository with correct email"
├─ Subject: DbAuthentication (via makeSut)
├─ Verb: auth(request)
├─ Helper: mockAuthenticationParams()
├─ Predicate: expect(loadAccountByEmailRepositorySpy.email).toBe(request.email)
└─ Context: Authentication domain contract (importado)
```

### 4.4 Validação semântica automática

Regras sugeridas:

```typescript
// Regra: toda frase precisa de assert
if (!spec.containsExpect()) {
  report('TEST-AAA', 'Spec sem expect - frase sem predicado')
}

// Regra: mocks devem estar localizados na pasta da camada de teste
if (spec.usesMockFromAnotherLayerWithoutIndexExport()) {
  report('TEST-LEXICON', 'Vocabulário reutilizado diretamente de outra camada')
}

// Regra: testes de domínio não podem importar infraestrutura
if (spec.layer === 'domain' && spec.importsInfra()) {
  report('TEST-ISOLATION', 'Domínio testado depende de infraestrutura')
}
```

---

## Parte 5: Comparação com gramática natural

| Elemento da língua natural            | Elemento da suíte de testes           | Exemplos                                               |
|--------------------------------------|---------------------------------------|--------------------------------------------------------|
| **Frase assertiva**                  | `test('Should ...', () => { ... })`   | Declara uma verdade sobre o sistema                    |
| **Parágrafo**                        | `describe('Context', () => { ... })`  | Agrupa frases relacionadas                             |
| **Advérbio temporal**                | Hooks (`beforeAll`, `afterEach`)      | "Antes de cada frase, resetar o banco"                 |
| **Vocabulário fictício (prosa)**     | Mocks/Stubs                           | Permite narrativas hipotéticas                         |
| **Discurso direto**                  | `expect(...).toHaveBeenCalledWith()`  | Cita chamadas realizadas                               |
| **Contraexemplo**                    | `expect(() => sut.handle()).toThrow()`| Demonstra restrição/erro                               |

---

## Parte 6: Anti-padrões como violações gramaticais

1. **Spec sem assert** — frase sem predicado (`expect`). Falha: não afirma nada verificável.
2. **Testes interdependentes** — parágrafos com referências cruzadas; viola princípio de isolamento (frases devem ser autônomas).
3. **Mocks inline repetidos** — vocabulário criado ad-hoc, dificulta coerência semântica (quebra coesão lexical).
4. **Testes grandes (>200 linhas)** — períodos extensos, surgem vírgulas demais, perda de clareza; indica responsabilidade múltipla.
5. **Importar produção real em mocks** — mistura de léxico real com fictício; similar a diálogo com personagens reais no ensaio.
6. **Falta de hooks para reset** — tempo verbal não estável; testes dependem um do outro (efeito side-effect).

---

## Parte 7: Ferramentas de validação automática

### 7.1 ESLint + Jest

Regras úteis vistas no projeto:
- `jest/expect-expect` — impede frases sem predicado.
- `jest/no-identical-title` — evita ambiguidade (não repetir título de frase).
- `jest/no-disabled-tests` — proíbe frases comentadas sem resolução.

### 7.2 Extensões sugeridas

```json
{
  "rules": {
    "testing-library/render-result-naming-convention": "error",
    "jest/max-nested-describe": ["warn", { "max": 2 }],
    "jest/no-conditional-expect": "warn",
    "jest/no-large-snapshots": "warn"
  }
}
```

### 7.3 Script customizado (pseudo)

```typescript
import { parseSpec } from './spec-parser'

for (const file of glob('tests/**/*.spec.ts')) {
  const tree = parseSpec(file)

  if (!tree.hasExpect()) {
    report(file, 'TEST-AAA', 'Spec sem expect (frase sem conclusão).')
  }

  if (tree.hasMultipleActs()) {
    report(file, 'TEST-SVO', 'Mais de uma ação principal - frase composta ambígua. Quebre em múltiplos testes.')
  }

  if (tree.importsProductionMutator()) {
    report(file, 'TEST-INFLECTION', 'Teste depende de mutação concreta. Prefira mocks/spies.')
  }
}
```

---

## Parte 8: Gramática generativa (Chomsky)

### 8.1 Consegue gerar novos testes sem exemplos?

Com as regras acima, qualquer desenvolvedor pode produzir uma spec válida para novo caso de uso:

1. Importar mocks/vocabulário pertinente.
2. Criar `makeSut`.
3. Definir `describe`.
4. Para cada comportamento: `test` com AAA.

### 8.2 Demonstração

**Objetivo**: criar teste para `DbCreatePayment`.

```typescript
import { DbCreatePayment } from '@/data/usecases'
import { CreatePaymentRepositorySpy } from '@/tests/data/mocks'
import { mockCreatePaymentParams } from '@/tests/domain/mocks'

const makeSut = () => {
  const createPaymentRepositorySpy = new CreatePaymentRepositorySpy()
  const sut = new DbCreatePayment(createPaymentRepositorySpy)
  return { sut, createPaymentRepositorySpy }
}

describe('DbCreatePayment UseCase', () => {
  test('Should call CreatePaymentRepository with correct values', async () => {
    const { sut, createPaymentRepositorySpy } = makeSut()
    const params = mockCreatePaymentParams()
    await sut.create(params)
    expect(createPaymentRepositorySpy.params).toEqual(params)
  })
})
```

Sem exemplos prévios de `DbCreatePayment`, as regras gramaticais são suficientes para gerar teste correto.

### 8.3 Propriedades da gramática de testes

- **Consistência**: títulos começam com "Should" (inglês modal), garantindo frase declarativa padrão.
- **Composabilidade**: hooks + fábricas + tests formam narrativas extensas sem perder clareza.
- **Expressividade**: engloba unitários, integração REST, GraphQL, middlewares, validators.
- **Verificabilidade**: Jest + ESLint + scripts customizados funcionam como parser e professor de gramática.

---

## Parte 9: Relação com o `nooa-core-engine`

1. **Atualizar `nooa.grammar.yaml`** para incluir papéis de testes (e.g., `TEST_PRESENTATION`, `TEST_DATA`) garantindo que a gramática reconheça essas “frases”.
2. **Replicar AAA e makeSut** ao escrever specs do Nooa, preservando a gramática generativa.
3. **Criar vocabulário em `src/tests/mocks`** equivalente ao `tests/**/mocks` de Manguinho.
4. **Adicionar regras do ESLint/Jest** para impedir violações gramaticais.
5. **Planejar testes de integração** para CLI, similar a `tests/main/routes` e `tests/main/graphql`.

---

## Resumo

- A suíte de testes de Rodrigo Manguinho é organizada como linguagem formal: camadas-especs refletem camadas de produção.
- Padrões AAA, makeSut e mocks por camada garantem frases claras e independentes.
- Hooks e integrações mapeiam advérbios temporais e parágrafos completos.
- Anti-padrões equivalem a frases malformadas (sem predicados, run-on sentences, vocabulário indefinido).
- A gramática é suficientemente precisa para gerar novas specs e ser validada automaticamente.

**Próximos passos para o nooa-core-engine**:
1. Modelar gramática de testes no `nooa.grammar.yaml`.
2. Iniciar suíte refletindo essas regras (especialmente AAA + makeSut).
3. Automatizar validação gramatical (lint + scripts).

Assim, testes deixam de ser artefatos isolados e passam a compor, junto ao código de produção, uma linguagem arquitetural coesa e verificável.

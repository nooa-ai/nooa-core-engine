# GitHub Setup Guide

Este guia mostra como publicar o Nooa Core Engine no GitHub.

---

## Pré-requisitos

1. **Criar o repositório no GitHub**:
   - Acesse: https://github.com/organizations/nooa-ai/repositories/new
   - Nome do repositório: `nooa-core-engine`
   - Descrição: `Architectural Grammar Validator & Code Hygiene Guardian for TypeScript Projects`
   - Visibilidade: Public
   - **NÃO** inicialize com README, .gitignore ou LICENSE (já temos esses arquivos)
   - Clique em "Create repository"

2. **Copiar a URL do repositório**:
   ```
   https://github.com/nooa-ai/nooa-core-engine.git
   ```

---

## Comandos Git para Publicação

Execute estes comandos **na pasta do projeto** (`/Users/thiagobutignon/dev/nooa-core-engine`):

### 1. Inicializar Git (se ainda não foi feito)

```bash
cd /Users/thiagobutignon/dev/nooa-core-engine

# Verificar se já é um repositório git
git status

# Se NÃO for um repositório, inicialize:
git init
```

### 2. Adicionar Todos os Arquivos

```bash
# Adicionar todos os arquivos ao staging
git add .

# Verificar o que será commitado
git status
```

### 3. Criar o Commit Inicial

```bash
git commit -m "Initial commit: Nooa Core Engine v1.2.0

- Architectural grammar validator
- Code hygiene features (synonym detection, zombie code detection)
- Clean Architecture compliance
- Self-validating dogfooding approach
- Complete documentation"
```

### 4. Configurar a Branch Principal

```bash
# Renomear branch para 'main' (GitHub padrão)
git branch -M main
```

### 5. Adicionar o Remote do GitHub

```bash
# Adicionar o repositório remoto
git remote add origin https://github.com/nooa-ai/nooa-core-engine.git

# Verificar se foi adicionado corretamente
git remote -v
```

### 6. Fazer o Push

```bash
# Push inicial (inclui todos os arquivos e configurações)
git push -u origin main
```

---

## Verificação Pós-Publicação

Após o push, verifique:

### 1. GitHub Actions (CI/CD)

- Acesse: https://github.com/nooa-ai/nooa-core-engine/actions
- O workflow "CI - Build and Test" deve executar automaticamente
- Verifique se passa (✅) ou falha (❌)

### 2. README.md

- Acesse: https://github.com/nooa-ai/nooa-core-engine
- O README deve aparecer formatado corretamente

### 3. Documentação

- Acesse: https://github.com/nooa-ai/nooa-core-engine/tree/main/docs
- Verifique se todos os arquivos estão visíveis

### 4. Releases

Para criar a primeira release (v1.2.0):

1. Acesse: https://github.com/nooa-ai/nooa-core-engine/releases/new
2. Tag version: `v1.2.0`
3. Release title: `Nooa Core Engine v1.2.0 - Code Hygiene Guardian`
4. Description: Copie o conteúdo relevante do `CHANGELOG.md`
5. Clique em "Publish release"

---

## Configurações Recomendadas do Repositório

### Branch Protection (main)

1. Acesse: Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Ative:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - ✅ `build` (do GitHub Actions)
     - ✅ `quality` (do GitHub Actions)
   - ✅ Require conversation resolution before merging

### Topics (Tags)

Adicione estes topics ao repositório (Settings → Topics):
- `clean-architecture`
- `typescript`
- `code-analysis`
- `architectural-validation`
- `dependency-analysis`
- `code-hygiene`
- `static-analysis`
- `linter`
- `clean-code`

### About Section

- Website: (se houver)
- Description: `Architectural Grammar Validator & Code Hygiene Guardian for TypeScript Projects`

---

## Comandos Úteis Futuros

### Fazer Commit de Mudanças

```bash
# Adicionar arquivos modificados
git add .

# Ou adicionar arquivos específicos
git add src/data/usecases/analyze-codebase.usecase.ts

# Commit
git commit -m "feat: add new feature"

# Push
git push origin main
```

### Criar Nova Branch (Feature Branch)

```bash
# Criar e mudar para nova branch
git checkout -b feature/nova-funcionalidade

# Fazer mudanças...
git add .
git commit -m "feat: implement nova-funcionalidade"

# Push da branch
git push -u origin feature/nova-funcionalidade

# Depois, criar Pull Request no GitHub
```

### Atualizar do Remote

```bash
# Baixar mudanças do GitHub
git pull origin main
```

---

## Troubleshooting

### Erro: "remote origin already exists"

```bash
# Remover o remote existente
git remote remove origin

# Adicionar novamente
git remote add origin https://github.com/nooa-ai/nooa-core-engine.git
```

### Erro: "Authentication failed"

Configure suas credenciais do GitHub:

```bash
# Usar GitHub CLI (recomendado)
gh auth login

# Ou configurar SSH
# https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

### Erro: "Large files"

Se houver arquivos muito grandes:

```bash
# Verificar tamanho dos arquivos
du -sh * | sort -h

# Adicionar ao .gitignore se necessário
echo "nome-do-arquivo-grande" >> .gitignore
```

---

## Status do Projeto

Após a publicação, o repositório terá:

- ✅ Código fonte completo (v1.2.0)
- ✅ Documentação completa (10 arquivos em `docs/`)
- ✅ GitHub Actions (CI/CD automático)
- ✅ Templates de Issues e PRs
- ✅ LICENSE (MIT)
- ✅ .gitignore configurado
- ✅ Auto-validação funcionando

---

## Próximos Passos

1. **Publicar no GitHub** (seguir os comandos acima)
2. **Verificar CI/CD** (GitHub Actions deve passar)
3. **Criar Release v1.2.0**
4. **Publicar no NPM** (opcional):
   ```bash
   npm login
   npm publish --access public
   ```
5. **Divulgar**:
   - Twitter/X
   - LinkedIn
   - Dev.to
   - Reddit (r/typescript, r/cleanarchitecture)

---

## Suporte

Se encontrar problemas durante a publicação:

1. Verifique os logs do GitHub Actions
2. Execute `npm start .` localmente para validar
3. Verifique a documentação do Git: https://git-scm.com/doc
4. Verifique a documentação do GitHub: https://docs.github.com

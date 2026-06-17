# Backstage — Gerenciamento de Agentes

## Problem Statement

Para criar um agente em uma org é preciso abrir o Insomnia, buscar o ID da organização manualmente, montar o body e passar uma chave especial no header. É lento e propenso a erro. Precisa de uma UI de backstage separada do socket tester para listar orgs e criar agentes diretamente.

## Goals

- [ ] Listar todas as organizações do backend
- [ ] Criar agente em uma org selecionada sem sair da ferramenta
- [ ] `x-account-id` fica no servidor (env) — nunca exposto ao browser

## Out of Scope

| Feature | Reason |
|---------|--------|
| Upload de imagem do agente | Não necessário para o fluxo de teste |
| Editar / deletar agentes | Fora do escopo atual |
| Paginação de orgs | Backend retorna até 50 por página, suficiente |

---

## User Stories

### P1: Listar organizações ⭐ MVP

**User Story**: Como admin, quero ver todas as orgs do backend para pegar o ID sem abrir o Insomnia.

**Acceptance Criteria**:
1. WHEN acesso `/backstage` THEN system SHALL listar orgs com nome, razão social e ID
2. WHEN não há agente logado no banco THEN system SHALL exibir mensagem para fazer login primeiro
3. WHEN o backend retornar erro THEN system SHALL exibir mensagem de erro

**Independent Test**: Abrir `/backstage` com agente salvo → lista de orgs aparece com IDs visíveis.

---

### P1: Criar agente em uma org ⭐ MVP

**User Story**: Como admin, quero criar um agente em uma org específica diretamente pela UI.

**Acceptance Criteria**:
1. WHEN clico em "Criar agente" numa org THEN system SHALL exibir formulário com nome, email e senha
2. WHEN submeto o formulário com dados válidos THEN system SHALL chamar POST /v1/agents com `x-account-id` do env e retornar o ID do agente criado
3. WHEN a criação falhar THEN system SHALL exibir a mensagem de erro do backend
4. WHEN a criação for bem-sucedida THEN system SHALL limpar o formulário e exibir confirmação com o ID

**Independent Test**: Preencher formulário → submit → ID do agente aparece na confirmação.

---

## Requirement Traceability

| ID | Story | Status |
|----|-------|--------|
| BKST-01 | P1: Listar orgs | Implementing |
| BKST-02 | P1: Criar agente | Implementing |

# Agent Login — Spec

## Problem Statement

O backend migrou de broadcast global para rooms por org/setor. Para validar o isolamento (evento de Org A não vaza para Org B; evento de setor X não chega a agente fora do setor), precisamos de dois painéis lado a lado com agentes de empresas/setores diferentes. Hoje é necessário colar o JWT manualmente a cada sessão e ao recarregar a página perde-se qual agente estava em qual painel.

## Goals

- [ ] Login via email+senha que salva o agente no SQLite (persiste entre browsers na mesma máquina)
- [ ] Seleção rápida de agente salvo sem precisar redigitar credenciais
- [ ] Cada painel exibe claramente nome, empresa e role do agente conectado

## Out of Scope

| Feature | Reason |
|---------|--------|
| Refresh token automático | Ferramenta de teste local, não produção |
| Mais de 2 painéis | Fora do escopo atual |
| Gerenciamento de setores | Apenas observar eventos |

---

## User Stories

### P1: Login e salvar agente ⭐ MVP

**User Story**: Como testador, quero fazer login com email+senha para que meus agentes fiquem salvos e eu não precise colar token novamente.

**Acceptance Criteria**:
1. WHEN submeto credenciais válidas THEN system SHALL chamar POST /v1/login, salvar no SQLite e conectar o socket automaticamente
2. WHEN submeto credenciais inválidas THEN system SHALL exibir mensagem de erro no formulário
3. WHEN recarrego a página THEN system SHALL exibir lista de agentes salvos prontos para usar

**Independent Test**: Login com credenciais válidas → F5 → agente aparece na lista → clicar conecta o socket.

---

### P1: Selecionar agente salvo ⭐ MVP

**User Story**: Como testador, quero selecionar um agente já salvo para conectar sem redigitar credenciais.

**Acceptance Criteria**:
1. WHEN clico em um agente salvo THEN system SHALL conectar o socket com o token salvo
2. WHEN clico em "remover" num agente THEN system SHALL deletar do SQLite

**Independent Test**: Agente salvo → clicar → socket conecta e exibe eventos.

---

### P2: Trocar agente no painel

**User Story**: Como testador, quero trocar o agente de um painel sem recarregar a página.

**Acceptance Criteria**:
1. WHEN clico em "trocar" THEN system SHALL desconectar o socket e voltar à tela de seleção

---

## Requirement Traceability

| ID | Story | Status |
|----|-------|--------|
| LOGIN-01 | P1: Login e salvar | Implementing |
| LOGIN-02 | P1: Selecionar salvo | Implementing |
| LOGIN-03 | P2: Trocar agente | Implementing |

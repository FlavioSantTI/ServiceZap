# 📘 Guia Completo: Multi-Tenant WhatsApp & Saneamento de Banco — ServiceZap

Este documento resume a arquitetura implementada, os procedimentos de teste e os scripts de manutenção do **ServiceZap Multi-Tenant**.

---

## 🏗️ 1. Princípio Fundamental de Isolamento

> **Regra de Negócio**: **1 Empresa (Tenant) = 1 Número de WhatsApp = 1 Sessão Baileys = Dados 100% Isolados no Appwrite.**

- **Engine de WhatsApp (`embeddedEngine.ts`)**:
  - Armazena as sessões em diretórios segregados: `.whatsapp_sessions/{tenantId}/`.
  - Mantém instâncias independentes em memória através de `global.__whatsAppEngines`.
  - Permite pareamento seguro por código de 8 dígitos (`Pairing Code`), limpando sessões anteriores automaticamente ao gerar um novo código.
  - Detecta o número conectado lendo tanto o socket em tempo real quanto os arquivos de credenciais (`creds.json`).

- **Base de Dados Appwrite**:
  - Todas as consultas, criações e atualizações das coleções (`clients`, `services`, `invoices`, `work_orders`, `messages`, `whatsapp_instances`, `audit_logs`) utilizam o filtro `Query.equal('tenantId', tenantId)`.
  - O `tenantId` é resolvido de forma segura via sessão do usuário autenticado no servidor (`getTenantId()`).

---

## 👥 2. Contas de Teste Pré-Configuradas

| Empresa / Perfil | E-mail | Tenant ID | Plano | Dados Iniciais no Banco |
| :--- | :--- | :--- | :--- | :--- |
| 🔵 **Empresa Alpha** | `alpha@servicezap.com` | `tenant_01` | **PRO** | • *Alpha Climatização & Elétrica Ltda*<br>• 2 Serviços de Climatização<br>• 1 Cliente (*Condomínio Solar das Flores*) |
| 🟢 **Empresa Beta** | `beta@servicezap.com` | `tenant_02` | **STARTER** | • *Beta Hidráulica & Desentupidora*<br>• 2 Serviços Hidráulicos<br>• 1 Cliente (*Restaurante Sabor & Arte*) |
| 👑 **Super Admin** | `master@servicezap.com` | `tenant_master` | — | • *Acesso Global ao painel SaaS e Planos* |

---

## ⚡ 3. Como Testar o Sistema

### Passo 1: Login ou Alternância Rápida
1. Acesse `http://localhost:3000/login` e clique no botão de 1 clique para entrar como **Empresa Alpha**.
2. Ou use o menu suspenso de empresas no **cabeçalho superior direito (`Header`)** para alternar a qualquer momento entre **Empresa Alpha** e **Empresa Beta**.

### Passo 2: Conectar o WhatsApp da Empresa Alpha
1. Acesse o menu **WhatsApp & Mensagens** (`/dashboard/whatsapp`).
2. Clique em **Conectar via Código (8 Dígitos)**.
3. Digite o número de telefone com DDI e DDD (ex: `5511999998888`).
4. No seu WhatsApp do celular (*Aparelhos Conectados > Conectar com número de telefone*), insira o código gerado.
5. Ao confirmar, o sistema **atualizará automaticamente** os contatos e conversas na tela.

### Passo 3: Testar a Empresa Beta
1. Alterne a empresa no topo para **Empresa Beta**.
2. A tela recarregará limpa, exibindo os clientes e serviços da Beta, e a sessão de WhatsApp estará livre para conectar um segundo número independente.

### Passo 4: Limpar Histórico de Mensagens
- Caso queira zerar as mensagens de teste salvas para a empresa ativa, basta clicar no botão **"Limpar Histórico"** (ícone de lixeira) na barra superior do WhatsApp.

---

## 🛠️ 4. Scripts de Manutenção do Banco

Todos os scripts utilizam `tsx` e as credenciais do `.env.local`:

```bash
# 1. Recria as duas empresas de teste (Alpha e Beta) com usuários e serviços limpos:
npx tsx src/scripts/seed-clean-tenants.ts

# 2. Reseta e limpa todo o histórico operacional (mensagens, faturas, clientes de teste):
npx tsx src/scripts/reset-full-database.ts

# 3. Audita o banco de dados e exibe a contagem de documentos por tenantId:
npx tsx src/scripts/audit-database-tenants.ts

# 4. Saneia e valida integridade de instâncias e clientes:
npx tsx src/scripts/clean-and-sanitize-db.ts
```

---

*Documento gerado e validado em 08/09/2026 para o ServiceZap.*

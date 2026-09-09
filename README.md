# ⚡ ServiceZap — Plataforma SaaS Multi-Tenant de CRM, OS & Automação WhatsApp

![Version](https://img.shields.io/badge/version-1.0.0--beta-purple?style=for-the-badge)
![Next.js 16](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=next.js)
![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Appwrite](https://img.shields.io/badge/Appwrite-Backend_%26_Realtime-F02E65?style=for-the-badge&logo=appwrite)
![WhatsApp Engine](https://img.shields.io/badge/WhatsApp-Engine_Nativa_Multi--Tenant_(Baileys)-25D366?style=for-the-badge&logo=whatsapp)

**ServiceZap** é uma solução SaaS completa, moderna e de alta performance projetada para Prestadores de Serviços, Autônomos, Assistências Técnicas, Clínicas e Empresas que buscam automatizar seu atendimento no WhatsApp, emitir Ordens de Serviço (O.S.) e Orçamentos com PDF profissional, gerenciar faturas com PIX e controlar agendamentos e equipes em uma plataforma **Multi-Tenant isolada e segura**.

---

## 🌟 Destaques da Versão 1.0.0 Beta

- **💬 Atendimento WhatsApp Nativo em Tempo Real:** Sincronização fluida via WebSockets sem recarregamento ou oscilação de tela.
- **⚡ Envio de Faturas & PIX via WhatsApp:** Disparo direto com mensagem formatada, valor e chave PIX Copia e Cola para o cliente.
- **📊 Métricas & Indicadores Financeiros em Tempo Real:** Dashboard dinâmico com cálculo preciso de *Valor em Aberto*, *Faturamento Mensal*, *O.S. Prontas p/ Cobrança* e *Faturas Pendentes*.
- **📑 Ordens de Serviço & Orçamentos com PDF Profissional:** Numeração sequencial, exportação com `jsPDF` e conversão em fatura com 1 clique.
- **👥 Multi-Tenancy com Alternador de Empresas:** Isolamento completo de dados e sessões por `tenantId` com suporte a RBAC granular.
- **🛡️ Scripts de Saneamento & Setup Automatizado:** Scripts para provisionamento de índices no Appwrite, seeding de empresas de teste e auditoria de integridade.

---

## 🏗️ Arquitetura Multi-Tenant & WhatsApp Dedicado

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                    ServiceZap SaaS Gateway                  │
 └──────────────────────┬───────────────────────────────┬──────┘
                        │                               │
        ┌───────────────▼──────────────┐ ┌──────────────▼──────────────┐
        │ 🏢 Empresa Alpha (tenant_01) │ │ 🏢 Empresa Beta (tenant_02)  │
        ├──────────────────────────────┤ ├──────────────────────────────┤
        │ • Sessão Baileys #1          │ │ • Sessão Baileys #2          │
        │ • Número: WhatsApp Alpha     │ │ • Número: WhatsApp Beta      │
        │ • Clientes, OS, Faturas (A)  │ │ • Clientes, OS, Faturas (B)  │
        │ • Histórico Isolado          │ │ • Histórico Isolado          │
        └──────────────────────────────┘ └──────────────────────────────┘
```

> **Regra de Ouro:** **1 Empresa (Tenant) = 1 Número de WhatsApp = 1 Sessão Baileys Isolada = Dados Segregados no Appwrite.**

---

## 👥 Contas de Teste & Alternador de Empresas

A plataforma possui um sistema de autenticação e alternador rápido no cabeçalho superior direito:

| Perfil / Empresa | E-mail | Tenant ID | Descrição |
| :--- | :--- | :--- | :--- |
| 🔵 **Empresa Alpha** | `alpha@servicezap.com` | `tenant_01` | *Alpha Climatização & Elétrica Ltda* (Plano PRO) |
| 🟢 **Empresa Beta** | `beta@servicezap.com` | `tenant_02` | *Beta Hidráulica & Desentupidora* (Plano STARTER) |
| 👑 **Super Admin** | `master@servicezap.com` | `tenant_master` | *Painel Administrativo da Plataforma* |

---

## ✨ Recursos Detalhados por Módulo

### 💬 1. Atendimento WhatsApp Web Integrado
* **Pareamento por Código de 8 Dígitos (Pairing Code):** Conexão simples e rápida informando o número com DDD no celular (sem necessidade de escanear QR Code).
* **Sincronização Bidirecional sem Flicker:** Integração otimizada com Appwrite Realtime WebSockets (`useWhatsAppMessagesRealtime`), garantindo renderização reativa sem recarregamento da página.
* **Isolamento Total de Sessões:** Cada empresa possui sua pasta de sessão dedicada em `.whatsapp_sessions/{tenantId}/` e seu próprio motor Baileys em memória.
* **Áudios & PTT com Conversão Automática:** Gravação e envio de notas de voz convertidas no formato nativo WhatsApp (`OGG/Opus`) usando `@ffmpeg-installer/ffmpeg`.
* **Central de Mídias & Streaming (`/api/media/[id]`):** Servidor serverless embutido com suporte a streaming (`Accept-Ranges`) e galeria Lightbox.
* **Respostas Rápidas (`/quick-replies`):** Atalhos customizáveis (ex: `/pix`, `/saudacao`).
* **Etiquetas & Rótulos (`/labels`):** Tags coloridas para categorizar conversas e leads.

---

### 📋 2. Gestão de Ordens de Serviço (O.S.) & Orçamentos Pro
* **Gerador de Propostas e O.S.:** Criação de orçamentos e ordens de serviço com numeração sequencial (ex: `ORC-2026-001`, `OS-2026-001`).
* **Contador em Tempo Real:** Indicador dinâmico de *O.S. Prontas p/ Cobrança PIX* com somatório de serviços concluídos e faturados.
* **Múltiplos Itens & Unidades Customizáveis:** Suporte a `un`, `hora`, `kg`, `metro`, `m²`, `diária`, `sessão`, `serviço`.
* **Exportação em PDF de Alta Fidelidade:** Geração instantânea de documentos PDF estilizados (`jsPDF` + `jspdf-autotable`), com resumo financeiro, itens e campos para assinatura.
* **Envio Direto para WhatsApp:** Envio do documento em PDF diretamente no chat do cliente com 1 clique.

---

### 💰 3. Módulo de Faturamento, Faturas & Cobranças PIX
* **Dashboard Financeiro Conectado:** Cartão de métricas com total real de *Valor em Aberto*, faturas pagas e pendentes do tenant ativo.
* **Disparo de Fatura com PIX:** Envio automático ou sob demanda dos dados de pagamento formatados no WhatsApp do cliente.
* **Modal PIX Integrado:** Geração de QR Code dinâmico e chave Copia e Cola para quitação imediata.
* **Recibo de Serviços em PDF:** Emissão de Recibo digital com marca d'água de quitação.
* **Histórico LTV (Lifetime Value):** Total pago e volume de faturas acumuladas por cliente.

---

### 🗓️ 4. Agenda Interna & Atendimentos
* **Agendamento Inteligente:** Marcação de compromissos vinculados a Clientes e Serviços do catálogo.
* **Status do Atendimento:** Acompanhamento dos status (*Agendado*, *Confirmado*, *Em Atendimento*, *Concluído*, *Cancelado*, *No-show*).

---

### 👥 5. Gestão de Equipe & Permissões Granulares (RBAC)
* **Controle de Colaboradores:** Convite e gestão de membros vinculados à mesma empresa.
* **Perfis & Roles:** Suporte a `owner`, `admin`, `user`, `operator`, `viewer`.
* **Permissões Granulares por Módulo:** Toggles individuais para controle de acessos a WhatsApp, OS, Faturamento e Clientes.

---

### 💳 6. Cobrança de Assinaturas do SaaS (Arquitetura Asaas)
* **Recebimento Exclusivo das Mensalidades da Plataforma:** O Asaas é conectado na conta Master do SaaS para gerenciar as assinaturas das empresas clientes (*Starter, Pro, Enterprise*).
* **Sem Intermediação nos Clientes Finais:** Os prestadores continuam recebendo seus pagamentos de forma direta e integral pelas suas próprias chaves PIX.
* **Webhook de Ativação Automática:** Reconhecimento instantâneo de pagamentos para liberação de planos e limites no Appwrite.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + TypeScript 5 |
| **Estilização & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + Shadcn UI + Lucide Icons |
| **Backend & Banco** | [Appwrite Cloud / Self-Hosted](https://appwrite.io/) (Database + Realtime WebSockets) |
| **WhatsApp Engine** | [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) (Multi-Session Engine) |
| **Processamento de Áudio** | Node.js Buffers + `@ffmpeg-installer/ffmpeg` (Conversor PTT OGG/Opus) |
| **Geração de PDF** | `jsPDF` + `jspdf-autotable` |
| **Busca de Endereço** | API ViaCEP |

---

## 🚀 Guia de Instalação e Execução

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/FlavioSantTI/ServiceZap.git
cd ServiceZap
npm install
```

### 2. Configurar o `.env.local`
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=seu_project_id
APPWRITE_API_KEY=sua_api_key_admin
APPWRITE_DATABASE_ID=servicezap_db

# Coleções
APPWRITE_COLLECTION_CLIENTS=clients
APPWRITE_MESSAGES_COLLECTION_ID=messages
APPWRITE_COLLECTION_WHATSAPP=whatsapp_instances
APPWRITE_COLLECTION_TENANTS=tenants
APPWRITE_COLLECTION_USERS=users
APPWRITE_COLLECTION_SERVICES=services
APPWRITE_COLLECTION_INVOICES=invoices
APPWRITE_COLLECTION_WORK_ORDERS=work_orders
APPWRITE_COLLECTION_SAAS_PLANS=saas_plans

# Asaas (Opcional / Plano Master)
ASAAS_ENV=sandbox
ASAAS_API_KEY=sua_asaas_master_key
ASAAS_WEBHOOK_TOKEN=seu_webhook_token
```

### 3. Scripts de Manutenção e Banco de Dados
```bash
# Provisionamento inicial das coleções e índices no Appwrite:
npm run db:setup
npm run db:setup:messages

# Recriar as duas empresas de teste (Alpha e Beta) com dados limpos:
npx tsx src/scripts/seed-clean-tenants.ts

# Limpar/resetar mensagens e dados operacionais de teste:
npx tsx src/scripts/reset-full-database.ts

# Auditar o banco e verificar a distribuição por tenantId:
npx tsx src/scripts/audit-database-tenants.ts
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📂 Estrutura de Diretórios

```text
ServiceZap/
├── src/
│   ├── app/
│   │   ├── (auth)/login/       # Tela de Login com 1-Click Multi-Tenant
│   │   ├── (dashboard)/        # WhatsApp, Clientes, OS, Faturas, Agenda, Equipe, Assinatura
│   │   ├── (superadmin)/       # Painel Global SuperAdmin
│   │   ├── actions/            # Server Actions isoladas por tenantId
│   │   └── api/                # API de Mídias (/api/media/[id]) e Webhooks
│   ├── components/             # Componentes modulares e telas
│   ├── hooks/                  # Realtime Hooks (useWhatsAppMessagesRealtime)
│   ├── lib/
│   │   ├── appwrite/           # Client SDK & Admin Server
│   │   ├── services/           # Sincronização e Serviços de Mensageria
│   │   ├── utils/              # getTenantId, whatsappUtils, audioConverter
│   │   └── whatsapp/           # EmbeddedWhatsAppEngine (Multi-tenant Baileys)
│   └── scripts/                # Scripts TSX de automação e saneamento
├── .whatsapp_sessions/         # Sessões isoladas em disco por tenantId
├── package.json
└── README.md
```

---

## 📝 Licença

Este projeto é um software sob a licença [MIT](LICENSE).

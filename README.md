# ⚡ ServiceZap — Plataforma Inteligente de CRM, OS & Automação WhatsApp

![Next.js 16](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=next.js)
![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Appwrite](https://img.shields.io/badge/Appwrite-Backend_%26_Realtime-F02E65?style=for-the-badge&logo=appwrite)
![WhatsApp Engine](https://img.shields.io/badge/WhatsApp-Engine_Nativa_(Baileys)-25D366?style=for-the-badge&logo=whatsapp)

**ServiceZap** é uma solução SaaS completa, moderna e robusta projetada para Prestadores de Serviços, Autônomos, Clínicas, Assistências Técnicas e Empresas que buscam automatizar seu atendimento no WhatsApp, emitir Ordens de Serviço e Orçamentos com PDF profissional, gerenciar faturas com PIX e controlar agendamentos e equipes em uma plataforma multi-tenant segura.

---

## 🌟 Visão Geral das Funcionalidades

```text
 📱 WhatsApp Web Realtime ──┐
 📋 Ordens de Serviço (OS) ─┼── ⚡ ServiceZap ─── 📊 Dashboard & Métricas
 💰 Cobranças & PIX ────────┤    (Multi-tenant)      🗓️ Agenda & Atendimentos
 👥 Equipe & Permissões ────┘                        🛡️ Trilha de Auditoria
```

---

## ✨ Recursos Detalhados por Módulo

### 💬 1. Atendimento WhatsApp Web Integrado (Engine Nativa)
* **Pareamento por Código de 8 Dígitos:** Conexão simples e rápida informando o número com DDD (sem necessidade de QR Code ou infraestrutura externa complexa).
* **Sincronização Bidirecional em Tempo Real:** Envie e receba mensagens diretamente pelo painel ou pelo aplicativo móvel. Atualização instantânea via WebSockets (**Appwrite Realtime**).
* **Auto-Cadastro Inteligente de Leads:** Novos clientes que entram em contato via WhatsApp são automaticamente cadastrados no CRM com criação de perfil base.
* **Normalização de DDI/DDD:** Tratamento automático de números brasileiros de 12 e 13 dígitos (com ou sem o 9º dígito suplementar).
* **Áudios & PTT com Conversão Automática:** Gravação e envio de notas de voz convertidas em formato nativo WhatsApp (`OGG/Opus`) usando `@ffmpeg-installer/ffmpeg`.
* **Central de Mídias & Streaming (`/api/media/[id]`):** Servidor serverless embutido com suporte a streaming (`Accept-Ranges`), cache eficiente e galeria Lightbox em tela cheia.
* **Respostas Rápidas (`/quick-replies`):** Atalhos customizáveis (ex: `/pix`, `/saudacao`) para acelerar o tempo de resposta aos clientes.
* **Etiquetas & Rótulos (`/labels`):** Tags coloridas para categorizar conversas e leads (ex: *Novo Lead*, *Aguardando Aprovação*, *Pagamento Confirmado*).

---

### 📋 2. Gestão de Ordens de Serviço (O.S.) & Orçamentos Pro
* **Gerador de Propostas e O.S.:** Criação de orçamentos e ordens de serviço com numeração sequencial (ex: `ORC-2026-001`, `OS-2026-001`).
* **Múltiplos Itens & Unidades Customizáveis:** Suporte a diferentes unidades de medida (`un`, `hora`, `kg`, `metro`, `m²`, `diária`, `sessão`, `serviço`).
* **Prazos & Validade:** Definição de data de validade da proposta comercial e previsão de execução do serviço.
* **Exportação em PDF de Alta Fidelidade:** Geração instantânea de documentos PDF estilizados (usando `jsPDF` + `jspdf-autotable`), com resumo financeiro, detalhamento de itens, observações e campos para assinatura do prestador e do cliente.
* **Envio Direto para WhatsApp:** Envie a Ordem de Serviço ou Orçamento em formato PDF diretamente no chat do cliente no WhatsApp com apenas 1 clique!
* **Faturamento Automático:** Transforme orçamentos aprovados ou ordens concluídas em faturas financeiras instantaneamente.

---

### 💰 3. Módulo de Faturamento, Faturas & Cobranças PIX
* **Controle Financeiro de Cobranças:** Visualização do status das faturas (*Pendente*, *Paga*, *Vencida*, *Cancelada*).
* **Modal PIX Integrado:** Geração de QR Code dinâmico e código Copia e Cola para pagamento imediato pelo cliente.
* **Recibo de Serviços em PDF:** Emissão de Recibo de Serviços digital com marca d'água de quitação e comprovante em PDF.
* **Histórico LTV (Lifetime Value):** Cálculo automático do total pago e volume de faturas por cliente.

---

### 🗓️ 4. Agenda Interna & Controle de Atendimentos
* **Agendamento Inteligente:** Marcação de compromissos vinculados a Clientes e Serviços do catálogo.
* **Controle de Responsáveis & Locais:** Definição do técnico/atendente responsável e localização do atendimento (sede da empresa ou endereço do cliente).
* **Status do Atendimento:** Acompanhamento dos status (*Agendado*, *Confirmado*, *Em Atendimento*, *Concluído*, *Cancelado*, *Não Compareceu / No-show*).

---

### 👥 5. Gestão de Equipe & Permissões Granulares (RBAC)
* **Controle de Colaboradores:** Convite e gestão de membros da equipe vinculados à mesma empresa.
* **Perfis & Roles:** Suporte a papéis (`owner`, `admin`, `user`, `operator`, `viewer`).
* **Permissões Granulares por Módulo:** Toggles individuais para controlar quem pode gerenciar Agenda, Ordens de Serviço, Faturas, WhatsApp, Serviços, Clientes, Emissão Fiscal e Relatórios.

---

### 🛡️ 6. Trilha de Auditoria (Audit Logs)
* **Rastreabilidade Total:** Registro de logs de auditoria por empresa para ações sensíveis (criação e alteração de OS, atualizações de faturas, acessos e alterações de equipe).

---

### 👑 7. Painel SuperAdmin & Multi-Tenancy SaaS
* **Arquitetura Multi-Tenant:** Isolamento completo de dados entre diferentes empresas/prestadores de serviço.
* **Cadastro PF / PJ:** Suporte a CPF (Pessoa Física / Autônomo) e CNPJ (Pessoa Jurídica / Empresa).
* **Regime Fiscal & Impostos:** Configuração de regimes tributários (*Simples Nacional*, *Lucro Presumido*, *MEI*, *Autônomo PF*, *Isento*) e alíquota de ISS.
* **Gestão de Planos SaaS:** Controle de planos (*Free*, *Starter*, *Pro*, *Enterprise*), limites de usuários e recursos habilitados (`planEnforcer`).

---

## 🛠️ Arquitetura e Tecnologias

| Camada | Tecnologias Utilizadas |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + TypeScript 5 |
| **Estilização & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + Base UI / Shadcn UI + Lucide Icons |
| **Backend & Banco** | [Appwrite Cloud / Self-Hosted](https://appwrite.io/) (Database + Realtime WebSockets) |
| **WhatsApp Engine** | [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) (In-memory Engine) |
| **Processamento de Áudio** | Node.js Buffers + `@ffmpeg-installer/ffmpeg` (Conversão PTT OGG/Opus) |
| **Geração de PDF** | `jsPDF` + `jspdf-autotable` |
| **Busca de CEP** | API ViaCEP (Autocompletar de endereço residencial/comercial) |

---

## 🚀 Guia de Instalação e Execução

### Pré-requisitos
* **Node.js:** v18.0.0 ou superior
* **npm** ou **yarn**
* Instância do **Appwrite** (Cloud ou Self-Hosted)

### 1. Clonar o repositório
```bash
git clone https://github.com/FlavioSantTI/ServiceZap.git
cd ServiceZap
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie ou atualize o arquivo `.env.local` na raiz do projeto:

```env
# Appwrite Backend Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=seu_project_id
APPWRITE_API_KEY=sua_api_key_admin_com_escopos_database
APPWRITE_DATABASE_ID=servicezap_db

# Nomes / IDs das Coleções Appwrite
APPWRITE_COLLECTION_CLIENTS=clients
APPWRITE_MESSAGES_COLLECTION_ID=messages
APPWRITE_COLLECTION_WHATSAPP=whatsapp_instances

# Instância Padrão do WhatsApp
WHATSAPP_SESSION_NAME=servicezap_main
```

### 4. Executar Scripts de Configuração do Banco de Dados
Para criar automaticamente as coleções, atributos e índices no Appwrite:

```bash
# Configura banco de dados, coleções de clientes, faturas, serviços e WhatsApp
npm run db:setup

# Configura a coleção de mensagens em tempo real
npm run db:setup:messages
```

### 5. Executar a Aplicação em Desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📂 Estrutura do Projeto

```text
ServiceZap/
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Páginas do Painel (Dashboard, Clientes, WhatsApp, Faturas, Agenda, OS, Equipe, Auditoria, Assinatura)
│   │   ├── (superadmin)/       # Painel Global SuperAdmin SaaS
│   │   ├── actions/            # Server Actions (WhatsApp, OS, Faturas, Clientes, Serviços, Equipe, Agenda, Tenant)
│   │   ├── api/
│   │   │   ├── media/[id]/     # Handler Serverless de Streaming de Mídias
│   │   │   └── webhooks/       # Webhooks de WhatsApp e integrações
│   │   └── page.tsx            # Landing Page / Autenticação
│   ├── components/
│   │   ├── agenda/             # Componentes de Agendamento
│   │   ├── clients/            # Componentes e Modais de CRM de Clientes
│   │   ├── dashboard/          # Cards de Métricas e Gráficos
│   │   ├── invoices/           # Tabelas de Faturas, Modal PIX e Recibo
│   │   ├── layout/             # Header, Sidebar e Navegação Mobile
│   │   ├── services/           # Diálogos de Catálogo de Serviços
│   │   ├── super-admin/        # Componentes do Painel SuperAdmin
│   │   ├── team/               # Modal de Gestão e Permissões da Equipe
│   │   ├── ui/                 # Componentes UI Reutilizáveis
│   │   ├── whatsapp/           # Chat Interface, Respostas Rápidas, Etiquetas e Anexos
│   │   └── work-orders/        # Formulários e Tabelas de Orçamentos e Ordens de Serviço
│   ├── hooks/                  # Custom Hooks (useWhatsAppMessagesRealtime, etc.)
│   ├── lib/
│   │   ├── appwrite/           # Clientes Appwrite (Client SDK & Admin Server)
│   │   ├── services/           # Services (pdfService, whatsappSyncService, auditService, cepService, planEnforcer)
│   │   ├── utils/              # Conversor de áudio PTT, Gerenciador de mídias em disco
│   │   └── whatsapp/           # Motor Baileys nativo em memória
│   ├── scripts/                # Scripts Node/TSX para provisionamento do banco Appwrite
│   └── types/                  # Definições TypeScript (Models Appwrite, Permissões, Faturas, OS)
├── .media_storage/             # Diretório local de armazenamento de mídias (ignorado no git)
├── package.json
└── README.md
```

---

## 🔗 Repositório no GitHub

O projeto está hospedado no GitHub: [FlavioSantTI/ServiceZap](https://github.com/FlavioSantTI/ServiceZap).

Para clonar e trabalhar no projeto:
```bash
git clone https://github.com/FlavioSantTI/ServiceZap.git
cd ServiceZap
```

---

## 📝 Licença

Este projeto é um software proprietário sob a licença [MIT](LICENSE).

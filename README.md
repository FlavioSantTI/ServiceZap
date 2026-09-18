# ⚡ ServiceZap — Plataforma SaaS Multi-Tenant de CRM, OS & Automação WhatsApp

![Version](https://img.shields.io/badge/version-1.1.1--RC-teal?style=for-the-badge)
![Next.js 16](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=next.js)
![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Appwrite](https://img.shields.io/badge/Appwrite-Backend_%26_Realtime-F02E65?style=for-the-badge&logo=appwrite)
![WhatsApp Engine](https://img.shields.io/badge/WhatsApp-Engine_Nativa_Multi--Tenant_(Baileys)-25D366?style=for-the-badge&logo=whatsapp)

**ServiceZap** é uma solução SaaS completa, moderna e de alta performance projetada para Prestadores de Serviços, Autônomos, Assistências Técnicas, Clínicas e Empresas que buscam automatizar seu atendimento no WhatsApp, emitir Ordens de Serviço (O.S.) e Orçamentos com PDF profissional, gerenciar faturas com PIX e controlar agendamentos e equipes em uma plataforma **Multi-Tenant isolada e segura**.

---

## 🚀 O que há de novo na v1.1.1-RC (Release Candidate)

### 🎨 Nova Landing Page SaaS Modern com Identidade Turquesa
- **Redesign Visual Completo (`/piloto`, `/campanha`):** Landing Page reformulada com estilo Modern SaaS contemporâneo em tons de turquesa (`#18B5B5`), azul petróleo (`#0E969C`), verde água claro (`#C8F3EF`) e texto `#06232D`.
- **Navbar em Card Flutuante:** Card branco centralizado (~88% largura, `rounded-[18px]`, `shadow-sm`, logo + links + CTA `"Quero participar"`).
- **Hero Section em Duas Colunas com Mockup SaaS:**
  - Badge `⚡ PROGRAMA PILOTO • ACESSO ANTECIPADO`.
  - Headline com destaque: *"Controle seu negócio e WhatsApp com **mais simplicidade**."*
  - Bloco de Oferta do Programa Piloto (Scarcity Box `#FFF7ED` com borda âmbar `#F59E0B`): `⚠️ APENAS 5 VAGAS` | `3 meses de acesso gratuito` | `🔥 Restam apenas 3 vagas`.
  - CTAs `"Garantir meus 3 meses grátis →"` e `"Conhecer a plataforma"`.
  - Mockup UI interativo do Dashboard ServiceZap em HTML/CSS/SVG com métricas em tempo real, atendimentos e cards flutuantes.
- **Seção de Benefícios em Grid:** 4 cards brancos (`rounded-2xl`, borda `#E2F3F2`, ícones com fundo `#C8F3EF` e cor `#18B5B5`).
- **Seção de FAQ em Accordion Interativo:** Respostas claras sobre o funcionamento do Programa Piloto, gratuidade e 5 vagas.
- **Chamada Final em Turquesa:** Container `#0E969C` com reforço de urgência e botão de inscrição.

### 🧪 Suíte de Testes Automatizados E2E com Playwright
- **Automação E2E Integrada:** Instalação e configuração do `@playwright/test` em [`playwright.config.ts`](file:///c:/Users/flavi/OneDrive/Desktop/2026/app/ServiceZap/playwright.config.ts).
- **Suítes de Testes (`e2e/`):**
  - `e2e/auth.spec.ts`: Testes da página de login, validação de campos e recuperação de senha.
  - `e2e/navigation.spec.ts`: Proteção de rotas pelo middleware (`/dashboard` e `/super-admin`) e acesso público.
  - `e2e/campaign.spec.ts`: Testes visuais da Landing Page e abertura do Modal WhatsApp de Leads.
- **Novos scripts npm:** `npm run test:e2e` e `npm run test:e2e:ui`.

---

### 🌐 Landing Page & Programa Piloto Beta
- **Landing Page de Captação Completa** (`/piloto`, `/campanha`): Página de marketing modular com Hero animado, seção "O que é o ServiceZap", Benefícios, Programa Beta de 3 meses grátis e CTA final.
- **Formulário de Candidatura via WhatsApp Modal:** Modal de inscrição com campos de qualificação de lead (nome, WhatsApp, setor, volume diário, ferramenta atual, dor principal) e link de aprovação rápida.
- **Sistema de Tipos para Campanha** (`src/types/campaign.ts`): Tipos `LeadData`, `ApplicationFormData`, `BenefitItem`, `BetaStepItem` para fluxo de leads estruturado.
- **Server Action de Campanha** (`src/app/actions/campaign.ts`): Backend de processamento de leads e candidaturas.
- **Card de Leads no Super Admin** (`campaign-leads-card.tsx`): Componente para acompanhamento de candidatos no painel administrativo.
- **Botão flutuante WhatsApp** no mobile para captação de leads.

### 🔒 Middleware de Autenticação & Proteção de Rotas
- **Next.js Middleware** (`src/middleware.ts`): Proteção automática de rotas `/dashboard/*` e `/super-admin/*` com redirecionamento inteligente para `/login` e RBAC por role (`super_admin`, `master`, `user`).
- **Rotas públicas configuradas**: `/`, `/campanha`, `/piloto`, `/login`, `/api/webhooks`.
- **Redirect automático** de usuários autenticados que acessam `/login` para o painel correto conforme perfil.

### 🔑 Recuperação de Senha
- **Tela de Esqueci a Senha** (`/forgot-password`): Formulário estilizado com identidade ServiceZap para recuperação de acesso.
- **Tela de Redefinir Senha** (`/reset-password`): Formulário para definição da nova senha com validação e feedback visual.
- **Server Action** `requestPasswordResetAction` integrada ao fluxo de recuperação.

### 🎨 Redesign Visual & UI Premium
- **Sidebar Redesenhada**: Layout modernizado com ícones refinados, espaçamento otimizado e transições suaves.
- **Header Atualizado**: Alternador de empresas melhorado, avatar e menu de perfil com design premium.
- **Tela de Login Simplificada**: Interface mais limpa e direta, com foco na experiência do usuário.
- **Design System Global**: Atualização do `globals.css` com nova paleta de cores, tipografia refinada e variáveis CSS harmonizadas.
- **Logos Atualizados**: Novos assets visuais (`logo.jpg`, `logo.png`, `servicezap-logo.png`) com resolução aprimorada.
- **Todas as 10+ telas do Dashboard** receberam ajustes visuais: Agenda, Clientes, Faturas, Perfil, Serviços, Assinatura, Equipe, WhatsApp, Ordens de Serviço, Auditoria.
- **Super Admin** — páginas de Dashboard, Planos e Tenants redesenhadas com nova sidebar e layout.

### 🛡️ Segurança & Autenticação Reforçada
- **Eliminação do fallback automático**: O sistema não loga mais automaticamente como "Alpha" sem credenciais — exige autenticação explícita.
- **Validação de senha para Super Admin**: Acesso ao painel master agora exige senha configurável via `SUPERADMIN_PASSWORD`.
- **Cookies de role para RBAC**: Cookie `servicezap-user-role` para validação de permissões no middleware.
- **Login inteligente expandido**: Reconhecimento de novos padrões de e-mail e vinculação dinâmica de dados.

### ⚙️ Melhorias de Infraestrutura
- **Tenant Actions expandidas** (`src/app/actions/tenant.ts`): Novas ações com lógica aprimorada de isolamento e gestão multi-tenant.
- **Team Actions** (`src/app/actions/team.ts`): Melhorias no gerenciamento de membros e permissões.
- **Super Admin Actions** (`src/app/actions/super-admin.ts`): Ajustes na gestão centralizada de tenants e planos.
- **Script de Setup Completo** (`setup-full-appwrite-auth-db.ts`): Provisionamento automatizado de banco e autenticação no Appwrite.
- **Subprojeto de Referência** (`servicezap---programa-piloto-beta/`): Aplicação Vite de referência para o programa piloto com configuração independente.

---

## 🌟 Recursos da v1.0.0 Beta (08/09/2026)

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
| 👑 **Super Admin** | `flavio.santiago.ti@outlook.com` | `tenant_master` | *Painel Administrativo da Plataforma* |

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

### 🌐 7. Landing Page & Programa Piloto Beta *(Novo na v1.1)*
* **Página de Captação Modular (`/piloto`, `/campanha`):** Hero Section animado, apresentação do produto, benefícios, fluxo do programa beta e CTA final.
* **Modal WhatsApp com Formulário de Lead:** Qualificação do candidato com 6 campos estruturados + envio via WhatsApp.
* **Navbar Responsiva:** Barra de navegação com indicador de vagas restantes e CTA de inscrição.
* **Footer Institucional:** Links, redes sociais e informações de contato.
* **Botão Flutuante Mobile:** Pílula de contato rápido visível apenas em telas pequenas.

---

### 🔐 8. Autenticação Avançada & Middleware *(Novo na v1.1)*
* **Middleware Next.js:** Proteção automática de rotas privadas com redirecionamento por role.
* **Recuperação de Senha (`/forgot-password`, `/reset-password`):** Fluxo completo de recuperação com feedback visual e link de reset.
* **Autenticação sem Fallback:** Exigência de login explícito — sem acesso automático a contas demo.

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

# Super Admin (Opcional)
SUPERADMIN_PASSWORD=sua_senha_super_admin

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

# Setup completo (auth + banco):
npx tsx src/scripts/setup-full-appwrite-auth-db.ts

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
│   │   ├── (auth)/
│   │   │   ├── login/              # Tela de Login Multi-Tenant
│   │   │   ├── forgot-password/    # Recuperação de Senha (v1.1)
│   │   │   └── reset-password/     # Redefinição de Senha (v1.1)
│   │   ├── (dashboard)/            # WhatsApp, Clientes, OS, Faturas, Agenda, Equipe, Assinatura
│   │   ├── (superadmin)/           # Painel Global SuperAdmin
│   │   ├── campanha/               # Landing Page Campanha (v1.1)
│   │   ├── piloto/                 # Landing Page Piloto Beta (v1.1)
│   │   ├── actions/                # Server Actions (auth, tenant, team, campaign, super-admin)
│   │   └── api/                    # API de Mídias (/api/media/[id]) e Webhooks
│   ├── components/
│   │   ├── landing/                # Componentes da Landing Page (v1.1)
│   │   │   ├── hero-section.tsx
│   │   │   ├── about-servicezap-section.tsx
│   │   │   ├── benefits-section.tsx
│   │   │   ├── beta-program-section.tsx
│   │   │   ├── final-cta-section.tsx
│   │   │   ├── whatsapp-modal.tsx
│   │   │   ├── navbar.tsx
│   │   │   └── footer.tsx
│   │   ├── layout/                 # Header & Sidebar redesenhados (v1.1)
│   │   ├── dashboard/              # Metric Cards & WhatsApp Status
│   │   ├── super-admin/            # Painel de Gestão (inclui campaign-leads-card)
│   │   └── ...                     # Agenda, Clientes, Faturas, OS, Equipe, WhatsApp
│   ├── hooks/                      # Realtime Hooks (useWhatsAppMessagesRealtime)
│   ├── lib/
│   │   ├── appwrite/               # Client SDK & Admin Server
│   │   ├── services/               # Sincronização e Serviços de Mensageria
│   │   ├── utils/                  # getTenantId, whatsappUtils, audioConverter
│   │   └── whatsapp/               # EmbeddedWhatsAppEngine (Multi-tenant Baileys)
│   ├── middleware.ts               # Proteção de rotas & RBAC (v1.1)
│   ├── types/                      # Tipos TypeScript (campaign.ts, etc.)
│   └── scripts/                    # Scripts TSX de automação e saneamento
├── .whatsapp_sessions/             # Sessões isoladas em disco por tenantId
├── package.json
└── README.md
```

---

## 📋 Changelog

### v1.1.1-RC — 18/09/2026 (Release Candidate)
- ✅ Nova Landing Page Modern SaaS com paleta turquesa (`#18B5B5`, `#0E969C`, `#C8F3EF`)
- ✅ Navbar em Card Flutuante com logo, links de ancoragem e CTA
- ✅ Hero Section em duas colunas com Mockup SaaS real e Scarcity Box (5 Vagas / 3 Meses Grátis)
- ✅ Seção de Benefícios, FAQ em Accordion Interativo e Chamada Final
- ✅ Suíte completa de testes automatizados E2E com Playwright (`npm run test:e2e`)
- ✅ Validação do formulário de candidatura de leads e envio via WhatsApp
- ✅ Atualização da versão para `1.1.1-RC`

### v1.1.0 Beta — 09/09/2026
- ✅ Landing Page completa com 9 componentes modulares (`/piloto`, `/campanha`)
- ✅ Middleware Next.js para proteção de rotas e RBAC
- ✅ Fluxo de recuperação de senha (`/forgot-password`, `/reset-password`)
- ✅ Sistema de campanha e captação de leads com tipos TypeScript
- ✅ Redesign visual de todas as telas do Dashboard e Super Admin
- ✅ Sidebar e Header redesenhados com estética premium
- ✅ Login seguro sem fallback automático + validação de Super Admin
- ✅ Logos e assets visuais atualizados
- ✅ Script de setup completo do Appwrite (auth + DB)
- ✅ 45+ arquivos modificados, 10+ novos arquivos

### v1.0.0 Beta — 08/09/2026
- ✅ Atendimento WhatsApp Nativo Multi-Tenant com Baileys
- ✅ Ordens de Serviço & Orçamentos com PDF
- ✅ Faturamento PIX integrado ao WhatsApp
- ✅ Dashboard com métricas financeiras em tempo real
- ✅ Multi-Tenancy com alternador de empresas e RBAC
- ✅ Scripts de saneamento e setup automatizado

### v0.90 Beta — 08/09/2026
- ✅ Release intermediário com ajustes gerais

### v0.x — 04–07/09/2026
- ✅ Commit inicial, segurança, mídias, chat nativo e auto-cadastro CRM

---

## 📝 Licença

Este projeto é um software sob a licença [MIT](LICENSE).

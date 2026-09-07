# Especificação Completa do Projeto: NotaZap (TrampoZap)
**Versão do Documento:** 1.1 — Arquitetura de Validação & Execução  
**Data:** 04/09/2026  
**Stack Principal:** Next.js 15 (App Router, TypeScript, Tailwind, shadcn/ui), Supabase (PostgreSQL, Auth, Storage, RLS), n8n (Orquestração & IA), Evolution API (WhatsApp Engine), Asaas API (Pix Dinâmico), Focus NFe (NFS-e Nacional MEI).

---

## SUMÁRIO EXECUTIVO

1. **Visão do Produto & Estratégia de MVP**
2. **Arquitetura de Dados & Multi-Tenancy (Supabase SQL)**
3. **Mecanismo de Orquestração & Automação (n8n + Evolution API)**
4. **Regras de Negócio e Casos de Borda**
5. **Prompt Mestre de Inicialização para IA (Planejar & Aguardar Ordem)**

---

## 1. PRODUCT REQUIREMENTS DOCUMENT (PRD v1.1)

### 1.1. Visão do Produto
Micro-SaaS vertical para prestadores de serviços técnicos rápidos e atendimentos de campo (eletricistas, encanadores, técnicos de refrigeração/ar-condicionado, montadores de móveis e chaveiros) gerenciarem todo o ciclo de vida do cliente (triagem, orçamento com aprovação humana rápida, agendamento de slots, cobrança via Pix Dinâmico e recibo timbrado com garantia) diretamente pelo WhatsApp, com apoio de um dashboard web mobile-first.

### 1.2. Problema Validado
* **Atendimento Lento:** O profissional perde chamados e orçamentos enquanto está em campo realizando serviços técnicos.
* **Orçamentos Sem Padronização:** Preços passados de cabeça, gerando retrabalho ou prejuízo ao prestador.
* **Insegurança do Cliente Final:** Clientes residenciais cobram garantia por escrito do serviço e comprovação rápida do pagamento Pix.
* **Fricção Fiscal Desnecessária:** Exigir certificado digital A1 ou homologação municipal para empresas MEI travaria o onboarding no D1.

### 1.3. Decisões Estratégicas de Arquitetura & MVP
1. **Recibo Digital de Garantia no Core:** Em vez de forçar emissão de NFS-e no fluxo padrão, o sistema gera instantaneamente um PDF de Recibo com QR Code e Termo de Garantia Técnica (90 dias conforme Código de Defesa do Consumidor).
2. **NFS-e Nacional (MEI) como Add-on:** A emissão de NFS-e torna-se opcional para quando o cliente for PJ ou exigir nota, consumindo diretamente o **Emissor Nacional de NFS-e** (padrão DPS Receita Federal) via gateway de API unificado, sem necessidade de cadastros em prefeituras individuais.
3. **Human-in-the-Loop:** A IA não envia valores diretamente ao cliente final sem validação. Ela monta a proposta baseada no catálogo do prestador e dispara botões interativos no WhatsApp do profissional (`[✅ Aprovar e Enviar]` ou `[✏️ Ajustar Valor]`).
4. **Monetização:** Trial de 10 dias sem cartão. Planos Starter (R$ 89/mês) e Pro (R$ 149/mês), com cobrança avulsa de NFS-e (R$ 1,50/nota no Starter; 40 notas inclusas no Pro).

---

## 2. ESQUEMA DE BANCO DE DADOS (SUPABASE POSTGRESQL + RLS)

Execute este script no **SQL Editor** do Supabase para instanciar a estrutura com isolamento estrito por usuário autenticado:

```sql
-- Habilitar extensoes essenciais
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Tipos enumerados
do $$ begin
  create type quote_status_enum as enum (
    'draft',
    'pending_provider_approval',
    'sent_to_customer',
    'accepted',
    'declined',
    'expired',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status_enum as enum (
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status_enum as enum (
    'pending',
    'received',
    'overdue',
    'refunded',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type nfse_status_enum as enum (
    'not_requested',
    'pending_issue',
    'processing',
    'authorized',
    'error',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

-- 1. PROFILES (TENANTS)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  business_name text,
  cpf_cnpj text,
  phone text not null,
  email text not null,
  
  -- Configuracoes Evolution API
  evo_instance_name text unique,
  evo_instance_token text,
  evo_connected boolean default false,
  
  -- Integracao Asaas & Fiscal
  asaas_api_key text,
  asaas_wallet_id text,
  focus_nfe_token text,
  tax_regime text default 'MEI',
  
  service_category text default 'eletricista',
  default_warranty_days int default 90,
  pix_key text,
  pix_key_type text,
  auto_reply_enabled boolean default true,
  
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. SERVICE CATALOG
create table if not exists public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text,
  base_price numeric(10, 2) not null default 0.00,
  min_price numeric(10, 2) default 0.00,
  estimated_duration_min int default 60,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists idx_service_catalog_user on public.service_catalog(user_id);

-- 3. CUSTOMERS
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  phone_whatsapp text not null,
  name text,
  document_cpf_cnpj text,
  email text,
  address_street text,
  address_neighborhood text,
  address_city text,
  address_state text default 'TO',
  address_zip text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, phone_whatsapp)
);
create index if not exists idx_customers_user_phone on public.customers(user_id, phone_whatsapp);

-- 4. QUOTES
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  code text not null,
  status quote_status_enum default 'draft' not null,
  initial_request_text text,
  audio_transcription text,
  problem_summary text,
  media_urls text[],
  labor_value numeric(10, 2) default 0.00 not null,
  materials_value numeric(10, 2) default 0.00 not null,
  displacement_fee numeric(10, 2) default 0.00 not null,
  total_value numeric(10, 2) generated always as (labor_value + materials_value + displacement_fee) stored,
  estimated_time_hours numeric(4, 1) default 1.0,
  warranty_days int default 90,
  validity_days int default 7,
  expires_at timestamptz,
  provider_approved_at timestamptz,
  sent_to_customer_at timestamptz,
  customer_accepted_at timestamptz,
  pdf_quote_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists idx_quotes_user_status on public.quotes(user_id, status);

-- 5. APPOINTMENTS
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  quote_id uuid references public.quotes(id) on delete set null,
  status appointment_status_enum default 'scheduled' not null,
  scheduled_date date not null,
  scheduled_time_slot text not null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  location_address text,
  google_event_id text,
  reminder_24h_sent boolean default false,
  reminder_2h_sent boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists idx_appointments_user_date on public.appointments(user_id, scheduled_date);

-- 6. PAYMENTS & RECEIPTS
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  quote_id uuid references public.quotes(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  asaas_payment_id text unique,
  amount numeric(10, 2) not null,
  status payment_status_enum default 'pending' not null,
  pix_qr_code_base64 text,
  pix_copy_paste text,
  pix_expiration_date timestamptz,
  paid_at timestamptz,
  payment_method text default 'PIX',
  receipt_code text unique,
  receipt_pdf_url text,
  warranty_expires_at date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists idx_payments_user_status on public.payments(user_id, status);

-- 7. NFSE ISSUANCES (MEI NACIONAL)
create table if not exists public.nfse_issuances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status nfse_status_enum default 'pending_issue' not null,
  gateway_reference text,
  service_code_cnae text,
  service_description text not null,
  service_amount numeric(10, 2) not null,
  nfse_number text,
  nfse_verification_code text,
  xml_url text,
  pdf_url text,
  error_message text,
  issued_at timestamptz,
  created_at timestamptz default now() not null
);
create index if not exists idx_nfse_user_status on public.nfse_issuances(user_id, status);

-- 8. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.service_catalog enable row level security;
alter table public.customers enable row level security;
alter table public.quotes enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.nfse_issuances enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "service_catalog_manage_own" on public.service_catalog for all using (auth.uid() = user_id);
create policy "customers_manage_own" on public.customers for all using (auth.uid() = user_id);
create policy "quotes_manage_own" on public.quotes for all using (auth.uid() = user_id);
create policy "appointments_manage_own" on public.appointments for all using (auth.uid() = user_id);
create policy "payments_manage_own" on public.payments for all using (auth.uid() = user_id);
create policy "nfse_manage_own" on public.nfse_issuances for all using (auth.uid() = user_id);

-- 9. TRIGGER DE AUTO-CRIAÇÃO DE PERFIL
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Prestador'),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 3. ARQUITETURA DE INTEGRAÇÃO & AUTOMAÇÃO (n8n + EVOLUTION API)

### 3.1. Pipeline de Execução
```
[Cliente WhatsApp] ──► [Evolution API Webhook]
                               │
                               ▼
                 [Normalizador & Router n8n]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 [Nova Mensagem de Cliente]           [Resposta de Botão Interativo]
            │                                     │
   (Supabase DB: Perfil + Catálogo)       (Supabase DB: Quotes)
            │                                     │
     (LLM: Triagem e Preço)             (Status: 'sent_to_customer')
            │                                     │
(Status: 'pending_provider_approval')             │
            │                                     ▼
            ▼                       [Dispara Proposta Formatada]
[Envia Botões no Zap do Prestador]        (No WhatsApp do Cliente)
```

### 3.2. Payload JSON de Exemplo para Envio de Botões Interativos (Evolution API)
```json
{
  "number": "5563999999999",
  "title": "🔔 *NOVO PEDIDO DE ORÇAMENTO*",
  "description": "Cliente: +5563988888888
Serviço: Troca de disjuntor geral e fiação do chuveiro

💵 Total Sugerido: *R$ 210,00*
(Mão de Obra: R$ 180,00 | Deslocamento: R$ 30,00)",
  "footer": "NotaZap • Confirmação Rápida",
  "buttons": [
    {
      "buttonId": "APPROVE_QUOTE_d824d772-5bb9-4b2a-95be-22cb0d0e6530",
      "buttonText": { "displayText": "✅ Aprovar e Enviar" },
      "type": 1
    },
    {
      "buttonId": "EDIT_QUOTE_d824d772-5bb9-4b2a-95be-22cb0d0e6530",
      "buttonText": { "displayText": "✏️ Ajustar Valor" },
      "type": 1
    }
  ]
}
```

---

## 4. MASTER PROMPT PARA IA DE DESENVOLVIMENTO (INICIALIZAR, PLANEJAR E AGUARDAR)

> **Instruções de Uso:** Copie o bloco abaixo e envie para o seu assistente de programação (Cursor, Lovable, Claude Code, etc.). Ele foi instruído a internalizar todo o contexto, gerar o planejamento detalhado e **aguardar a sua autorização** antes de escrever código ou criar arquivos no repositório.

```markdown
# MASTER PROMPT: ENGENHEIRO DE SOFTWARE LÍDER - NOTAZAP

Você é o Engenheiro de Software Líder e Arquiteto Full-Stack encarregado de implementar o produto **NotaZap (TrampoZap)**.

## SEU PAPEL E COMPORTAMENTO OBRIGATÓRIO:
1. **NÃO ESCREVA CÓDIGO DA APLICAÇÃO AINDA.**
2. **NÃO CRIE ARQUIVOS NO REPOSITÓRIO AGORA.**
3. Sua única tarefa nesta primeira interação é:
   - Ler atentamente todas as diretrizes técnicas e regras de negócio descritas neste documento.
   - Apresentar um **Plano de Implementação Arquitetural Detalhado** estruturado em fases lógicas.
   - Identificar dependências técnicas, variáveis de ambiente necessárias e possíveis gargalos de integração.
   - **PARAR e AGUARDAR minha ordem expressa ("Pode começar a Fase X")** antes de gerar qualquer código-fonte, migrations ou componentes.

---

## CONTEXTO DO PRODUTO:
- **Público:** Prestadores de serviços técnicos de visita e campo (eletricistas, encanadores, técnicos de ar-condicionado).
- **Core Loop:** Mensagem no WhatsApp → Triagem por IA → Rascunho de Orçamento → Confirmação em 1 clique pelo prestador no WhatsApp (Human-in-the-Loop) → Envio ao cliente → Agendamento → Cobrança via Pix Dinâmico Asaas → Emissão automática de Recibo de Garantia em PDF.
- **Módulo Fiscal (Add-on):** Emissão de NFS-e MEI Nacional (padrão DPS/Receita Federal) via gateway (Focus NFe).

## STACK TECNOLÓGICA:
- **Frontend:** Next.js 15 (App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons).
- **Backend / Database:** Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security estrito por auth.uid(), Storage para PDFs/fotos).
- **Automação & Orquestração:** n8n (Webhooks para Evolution API e Asaas, Pipelines de LLM com structured output).
- **Motores Externos:** Evolution API v2 (WhatsApp), Asaas API v3 (Cobrança Pix), Focus NFe v2 (Fiscal MEI Nacional).

## REQUISITOS OBRIGATÓRIOS DO PLANEJAMENTO:
Seu plano de implementação deve cobrir detalhadamente:
1. **Estrutura de Pastas e Convenções:** Organização do projeto Next.js 15 (`app/`, `components/`, `lib/`, `hooks/`, `types/`, `actions/`).
2. **Setup de Segurança:** Configuração do client do Supabase (Server Components, Client Components e Route Handlers com `@supabase/ssr`).
3. **Mapeamento de Rotas do Dashboard PWA:**
   - `/login` e `/signup`
   - `/dashboard` (Visão geral de funil e métricas)
   - `/dashboard/quotes` (Gestão de orçamentos e aprovações manuais)
   - `/dashboard/calendar` (Janelas de atendimento)
   - `/dashboard/catalog` (Tabela de preços de serviços)
   - `/dashboard/settings` (Conexão Evolution API via QR Code, chaves Asaas e Focus NFe)
4. **Arquitetura de Webhooks:** Contratos de dados e tratamento de erros para os endpoints da Evolution API e Asaas.
5. **Estratégia de Testes e Validação:** Passos para validar cada funcionalidade localmente antes do deploy.

---

## EXECUÇÃO IMEDIATA:
Confirme que você assimilou 100% dos requisitos deste projeto. Em seguida, responda apresentando exclusivamente o seu **Diagnóstico e Plano de Ação Faseado**. Ao final da resposta, pergunte qual fase devo autorizar para iniciarmos o desenvolvimento. Não gere nenhum código de componente ou API agora.
```

---

## 5. CHECKLIST DE DEPLOY & VARIÁVEIS DE AMBIENTE (.env.example)

Para colocar a arquitetura no ar, configure as seguintes variáveis no seu ambiente:

```env
# NEXT.JS & SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico-restrita

# EVOLUTION API
EVOLUTION_API_URL=https://api.evolution.seuservidor.com
EVOLUTION_API_GLOBAL_KEY=sua-chave-mestra-evolution

# N8N WEBHOOKS
N8N_WEBHOOK_URL=https://n8n.seuservidor.com/webhook/webhook-evolution

# GATEWAYS (PREENCHIDOS PELO PRESTADOR OU PLATAFORMA)
ASAAS_API_URL=https://api.asaas.com/v3
FOCUS_NFE_API_URL=https://api.focusnfe.com.br/v2
```

# ⚡ ServiceZap — Plafotorma Inteligente de CRM & Automação de WhatsApp

![ServiceZap Banner](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Appwrite](https://img.shields.io/badge/Appwrite-Backend-F02E65?style=for-the-badge&logo=appwrite)
![Baileys](https://img.shields.io/badge/WhatsApp-Engine_Nativa-25D366?style=for-the-badge&logo=whatsapp)

**ServiceZap** é uma plataforma SaaS completa e moderna para Gestão de Clientes (CRM), Faturamento Financeiro e Atendimento via WhatsApp em tempo real. Desenvolvido com Next.js 15, TypeScript e um motor embutido de WhatsApp (Baileys), o ServiceZap oferece uma experiência fluida no estilo **WhatsApp Web**, com sincronização bidirecional, suporte completo a mídias e inteligência de auto-cadastro.

---

## ✨ Funcionalidades Principais

### 💬 1. Atendimento WhatsApp Web Integrado
* **Pareamento por Código de 8 Dígitos:** Conexão simples e rápida informando o número com DDD (sem necessidade de QR Code ou infraestrutura externa Docker).
* **Sincronização Bidirecional:** Envie e receba mensagens diretamente pelo painel ou pelo aplicativo nativo do celular. As conversas sincronizam instantaneamente em tempo real.
* **Auto-Detecção de Contatos:** Novos clientes que entram em contato via WhatsApp são automaticamente cadastrados no CRM com auto-criação de registro.
* **Normalização Inteligente de DDI/DDD:** Tratamento automático de números brasileiros de 12 e 13 dígitos (com ou sem o 9º dígito suplementar).

### 📸 2. Suporte Completo a Mídias & Anexos
* **Menu de Anexos Estilo WhatsApp Web:** Botão de clipe de papel com opções organizadas para:
  * 🖼️ **Fotos & Vídeos:** Suporte a JPG, PNG, WEBP, MP4, MOV, etc.
  * 🎙️ **Áudios & Notas de Voz (PTT):** Gravação e envio de áudios com player nativo.
  * 📄 **Documentos:** Envio de PDFs, DOCX, XLSX, TXT e outros arquivos.
* **Modal de Pré-Visualização:** Confirmação prévia do arquivo com campo opcional de legenda.
* **Renderização Rica no Chat:**
  * **Lightbox Fullscreen:** Clique nas imagens para ampliar em tela cheia.
  * **Player de Áudio Customizado:** Player compacto inline com ícone de microfone.
  * **Player de Vídeo Integrado:** Reprodução inline de vídeos diretamente na bolha de mensagem.
  * **Card de Documentos:** Download direto de arquivos com identificação de formato e tamanho.
* **Gerenciador Serverless de Mídia (`/api/media/[id]`):** Servidor de mídia embutido com suporte a streaming (`Accept-Ranges`), cache eficiente e persistência em buffer local.

### 📊 3. Painel CRM & Gestão Financeira
* **Dashboard em Tempo Real:** Indicadores de faturamento mensal, clientes ativos, faturas pendentes/pagas e volume de mensagens.
* **Gestão de Clientes:** Cadastro completo, histórico de conversas, busca dinâmica por nome/telefone e status.
* **Gestão de Faturas (Invoices):** Acompanhamento de cobranças e controle de recebimentos.

### 🎨 4. Design & Experiência do Usuário (UI/UX)
* **Design System Premium:** Estilização com Vanilla CSS e Tailwind CSS v4, suporte a modo claro e escuro (Light/Dark mode) e efeitos de glassmorphism.
* **Atualização em Tempo Real (Realtime WebSockets):** Integração com Appwrite Realtime para atualização de mensagens sem necessidade de recarregar a página.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend & Framework:** [Next.js 15 (App Router)](https://nextjs.org/) + React 19 + TypeScript
* **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) + Lucide React + Shadcn UI Components
* **Backend Database & Realtime:** [Appwrite Cloud / Self-Hosted](https://appwrite.io/)
* **WhatsApp Engine:** [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) incorporado em memória
* **Manipulação de Arquivos & Mídias:** Node.js File System Buffer + Route Handlers Serverless

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* Node.js v18.0.0 ou superior
* Gerenciador de pacotes `npm` ou `yarn`

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/ServiceZap.git
cd ServiceZap
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com as seguintes chaves:

```env
# Configurações do Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=seu_project_id
APPWRITE_API_KEY=sua_api_key_admin
APPWRITE_DATABASE_ID=servicezap_db
APPWRITE_COLLECTION_CLIENTS=clients
APPWRITE_MESSAGES_COLLECTION_ID=messages
APPWRITE_COLLECTION_WHATSAPP=whatsapp_instances

# Instância Padrão do WhatsApp
WHATSAPP_SESSION_NAME=servicezap_main
```

### 4. Executar em modo de desenvolvimento
```bash
npm run dev
```

Abra o navegador em [http://localhost:3000](http://localhost:3000) para acessar a plataforma.

---

## 📂 Estrutura do Projeto

```text
ServiceZap/
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Páginas do Painel (Dashboard, Clientes, WhatsApp, Faturas)
│   │   ├── actions/            # Server Actions (Envio de mensagens, mídias, conexão WA)
│   │   ├── api/media/[id]/     # Handler Serverless de Mídia & Streaming
│   │   └── page.tsx            # Landing Page / Redirecionamento
│   ├── components/
│   │   ├── ui/                 # Componentes genéricos de interface (Buttons, Cards, Dialogs)
│   │   └── whatsapp/           # Interface do Chat WhatsApp (Chat, Anexos, Pairing Code)
│   ├── hooks/                  # Custom Hooks (useWhatsAppMessagesRealtime, useTheme)
│   ├── lib/
│   │   ├── appwrite/           # Clientes Appwrite (Client e Admin Server)
│   │   ├── services/           # WhatsAppSyncService (Sincronização & Idempotência)
│   │   ├── utils/              # mediaStorage (Salvar e ler buffers de mídia em disco)
│   │   └── whatsapp/           # embeddedEngine (Motor Baileys incorporado em memória)
│   └── types/                  # Definições de Tipos TypeScript (Appwrite docs, Messages)
├── .media_storage/             # Diretório local de armazenamento de mídias (ignorado no git)
└── README.md
```

---

## 🔒 Segurança e Resiliência

* **Armazenamento Seguro:** As sessões de autenticação do WhatsApp e buffers de mídia são salvas localmente e isoladas no servidor, protegidas pelo `.gitignore`.
* **Desduplicação de Mensagens:** Sistema de identificação por WAMID para evitar duplicação de mensagens no banco de dados.
* **Fallbacks Automáticos:** Se o banco Appwrite não possuir os atributos de mídia estendidos criados no schema, o sistema realiza o salvamento em modo reduzido sem interrupção do serviço.

---

## 📝 Licença

Este projeto está sob a licença [MIT](LICENSE).

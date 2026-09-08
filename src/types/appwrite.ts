import { Models } from 'node-appwrite';

// Role do usuário no sistema Multi-tenant & Super Admin
export type UserRole = 'super_admin' | 'owner' | 'admin' | 'user' | 'operator' | 'viewer';

// Permissões Granulares por Colaborador dentro da Empresa (Tenant)
export interface UserPermissions {
  canManageAppointments: boolean; // Agenda & Atendimentos
  canManageWorkOrders: boolean;   // Orçamentos & Ordens de Serviço
  canManageInvoices: boolean;     // Cobranças, Faturas & Recibos PIX
  canManageWhatsApp: boolean;     // Chat em tempo real & Mensagens
  canManageServices: boolean;     // Catálogo de Serviços & Preços
  canManageClients: boolean;      // Cadastro & Gestão de Clientes CRM
  canManageFiscal: boolean;       // Emissão de NF-e & Regime Fiscal
  canViewReports: boolean;        // Faturamento, LTV & Relatórios
  canManageTeam?: boolean;        // Convidar membros e alterar permissões
}

export const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  canManageAppointments: true,
  canManageWorkOrders: true,
  canManageInvoices: true,
  canManageWhatsApp: true,
  canManageServices: true,
  canManageClients: true,
  canManageFiscal: true,
  canViewReports: true,
  canManageTeam: true,
};

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  canManageAppointments: true,
  canManageWorkOrders: true,
  canManageInvoices: false,
  canManageWhatsApp: true,
  canManageServices: false,
  canManageClients: true,
  canManageFiscal: false,
  canViewReports: false,
  canManageTeam: false,
};

// Status do Tenant
export type TenantStatus = 'active' | 'trialing' | 'trial' | 'past_due' | 'suspended' | 'canceled';

// Status do Pagamento / Fatura
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'canceled' | 'refunded';

// Status da Emissão de NF-e (Focus NFe)
export type NfeStatus = 'none' | 'processing' | 'authorized' | 'error' | 'canceled';

// Status da Instância do WhatsApp (Evolution API)
export type WhatsAppStatus = 'disconnected' | 'connecting' | 'connected';

// Status do Cliente no CRM
export type ClientStatus = 'active' | 'inactive' | 'lead';

// 1. Tenant (Organização / Prestador Autônomo ou Empresa)
export type PersonType = 'pf' | 'pj';

export interface TenantDocument extends Models.Document {
  personType?: PersonType; // 'pf' (Pessoa Física / Autônomo) ou 'pj' (Pessoa Jurídica / Empresa)
  name: string; // Nome Completo ou Nome Fantasia
  companyName?: string; // Razão Social (se PJ)
  profession?: string; // Profissão / Atividade Principal (se PF)
  document: string; // CPF ou CNPJ
  email: string;
  phone?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: TenantStatus;
  maxUsers?: number; // Limite de usuários contratado
  ownerName?: string; // Nome do Administrador Principal
  ownerEmail?: string; // E-mail do Administrador Principal
  pixKey?: string; // Chave PIX Padrão (CPF/CNPJ/Email/Telefone/Aleatória)
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  asaasCustomerId?: string; // ID do Cliente no Asaas para mensalidade do ServiceZap
  stripeCustomerId?: string; // ID do Cliente no Stripe para mensalidade
  // Dados de Emissão de Nota Fiscal / Documento Fiscal
  taxRegime?: 'simples_nacional' | 'lucro_presumido' | 'mei' | 'autonomo_pf' | 'isento';
  municipalRegistration?: string; // Inscrição Municipal / Registro de Autônomo
  issRate?: number; // Alíquota ISS (%)
  featuresJson?: string; // Sobrescrita de features caso contratado
}

// 2. Serviço / Produto do Catálogo
export interface ServiceDocument extends Models.Document {
  tenantId: string;
  name: string;
  description?: string;
  price: number; // Preço padrão em R$
  durationMinutes: number; // Duração estimada em minutos
  category: string; // Ex: Estética, Odontologia, Consulta, Suporte
  unit?: string; // Ex: 'un', 'hora', 'kg', 'metro', 'm²', 'diária', 'sessão', 'serviço'
  active: boolean;
}

// 3. Usuário (Vinculado a um Tenant)
export interface UserDocument extends Models.Document {
  userId: string; // Appwrite Auth User ID
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions?: UserPermissions;
  permissionsJson?: string;
  avatarUrl?: string;
  active?: boolean;
}

// 4. Cliente do Tenant (Para quem o Tenant envia cobranças e notas)
export interface ClientDocument extends Models.Document {
  tenantId: string;
  name: string;
  document: string; // CPF ou CNPJ
  email: string;
  phone: string; // WhatsApp
  status: ClientStatus;
  totalPaid?: number; // LTV (Lifetime Value) em R$
  totalInvoices?: number; // Total de faturas geradas
  address?: string;
  addressNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string; // Observações / Notas do CRM
  asaasCustomerId?: string; // ID do cliente na conta Asaas do Tenant
  labels?: string[]; // IDs ou nomes de rótulos atribuídos
}

// 5. Fatura / Cobrança
export interface InvoiceDocument extends Models.Document {
  tenantId: string;
  clientId: string;
  clientName: string;
  serviceId?: string; // ID do serviço vinculado
  amount: number;
  dueDate: string; // Formato YYYY-MM-DD
  status: InvoiceStatus;
  description?: string;
  // Integração Asaas
  asaasPaymentId?: string;
  pixQrCodeUrl?: string;
  pixCopyPaste?: string;
  bankSlipUrl?: string;
  // Integração Focus NFe
  nfeStatus: NfeStatus;
  nfeId?: string;
  nfeNumber?: string;
  nfePdfUrl?: string;
  nfeXmlUrl?: string;
  nfeErrorReason?: string;
}

// Status da Ordem de Serviço / Orçamento
export type WorkOrderStatus = 'draft' | 'quote_sent' | 'approved' | 'in_execution' | 'completed' | 'billed' | `rejected`;
export type WorkOrderType = 'quote' | 'work_order';

// 7. Ordem de Serviço / Orçamento
export interface WorkOrderItem {
  serviceId?: string;
  serviceName: string;
  unit?: string; // Ex: 'un', 'hora', 'kg', 'metro', 'm²', 'diária', 'sessão', 'serviço'
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface WorkOrderDocument extends Models.Document {
  tenantId: string;
  type: WorkOrderType;
  number: string; // Ex: ORC-2026-001 ou OS-2026-001
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  serviceId?: string;
  serviceName: string;
  itemsJson?: string; // Stringified WorkOrderItem[]
  amount: number;
  discount?: number;
  status: WorkOrderStatus;
  dueDate?: string; // Validade da proposta (formato YYYY-MM-DD)
  executionDate?: string; // Previsão de execução / entrega da OS (formato YYYY-MM-DD)
  notes?: string; // Observações / Laudo técnico
  invoiceId?: string; // ID da cobrança/fatura gerada após conclusão
}

// 6. Instância de WhatsApp (Evolution API)
export interface WhatsAppInstanceDocument extends Models.Document {
  tenantId: string;
  instanceName: string;
  instanceId: string;
  status: WhatsAppStatus;
  phone?: string;
  qrCode?: string;
  updatedAt: string;
}

// 8. Mensagens Híbridas WhatsApp (Evolution API + n8n + Appwrite)
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'received' | 'failed';
export type MessageMediaType = 'image' | 'video' | 'audio' | 'document';
export type MessageOrigin = 'app_ui' | 'whatsapp_native';

export interface MessageDocument extends Models.Document {
  phone: string; // E.164 limpo (ex: 5511999998888)
  content: string; // Conteúdo textual ou legenda
  direction: MessageDirection; // 'inbound' ou 'outbound'
  status: MessageStatus; // 'pending' | 'sent' | 'delivered' | 'received' | 'failed'
  origin: MessageOrigin; // 'app_ui' | 'whatsapp_native'
  whatsapp_message_id: string; // WAMID original do Baileys / Evolution API
  created_at: string; // ISO 8601 Timestamp
  tenantId?: string; // Tenant ID opcional para retrocompatibilidade
  mediaType?: MessageMediaType;
  mediaUrl?: string;
  mimeType?: string;
  fileName?: string;
}

// 9. Mensagens Rápidas (Quick Replies)
export interface QuickReplyDocument extends Models.Document {
  tenantId: string;
  title: string; // Ex: "Chave PIX e Instruções"
  shortcut: string; // Ex: "/pix"
  content: string; // Texto a ser inserido no chat
  category?: string; // Ex: "Financeiro", "Atendimento"
}

// 10. Rótulos / Etiquetas (Labels estilo WhatsApp Business)
export interface LabelDocument extends Models.Document {
  tenantId: string;
  name: string; // Ex: "Novo Cliente", "Aguardando Pagamento"
  color: string; // Cor HEX (ex: "#10B981")
  description?: string;
}

// 11. Agendamento de Atendimento (Agenda Interna)
export type AppointmentStatus =
  | 'scheduled'   // Agendado
  | 'confirmed'   // Confirmado pelo cliente
  | 'in_progress' // Em atendimento / Em rota
  | 'completed'   // Concluído
  | 'canceled'    // Cancelado
  | 'no_show';    // Não compareceu

export interface AppointmentDocument extends Models.Document {
  tenantId: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  serviceId?: string;
  serviceName: string;
  attendantName?: string; // Técnico ou responsável
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:mm
  durationMinutes: number; // Ex: 30, 45, 60
  status: AppointmentStatus;
  location?: string; // Ex: "Endereço do cliente" ou "Sede / Balcão"
  notes?: string;
  reminderSent?: boolean;
}

// 12. Trilha de Auditoria por Empresa (Audit Logs)
export type AuditCategory =
  | 'work_orders'
  | 'invoices'
  | 'appointments'
  | 'clients'
  | 'services'
  | 'team'
  | 'fiscal'
  | 'auth'
  | 'super_admin';

export interface AuditLogDocument extends Models.Document {
  tenantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string; // ex: 'work_order.create', 'work_order.status_change', 'invoice.mark_paid'
  category: AuditCategory;
  entityId?: string;
  entityName?: string;
  details?: string; // Resumo textual ou JSON de alterações
  ipAddress?: string;
  created_at?: string;
}

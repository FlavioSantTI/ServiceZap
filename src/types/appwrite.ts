import { Models } from 'node-appwrite';

// Role do usuário no sistema Multi-tenant
export type UserRole = 'owner' | 'admin' | 'operator' | 'viewer';

// Status do Tenant
export type TenantStatus = 'active' | 'trialing' | 'past_due' | 'canceled';

// Status do Pagamento / Fatura
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'canceled' | 'refunded';

// Status da Emissão de NF-e (Focus NFe)
export type NfeStatus = 'none' | 'processing' | 'authorized' | 'error' | 'canceled';

// Status da Instância do WhatsApp (Evolution API)
export type WhatsAppStatus = 'disconnected' | 'connecting' | 'connected';

// Status do Cliente no CRM
export type ClientStatus = 'active' | 'inactive' | 'lead';

// 1. Tenant (Organização/Empresa)
export interface TenantDocument extends Models.Document {
  name: string; // Nome Fantasia
  companyName?: string; // Razão Social
  document: string; // CPF ou CNPJ
  email: string;
  phone?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: TenantStatus;
  pixKey?: string; // Chave PIX Padrão (CPF/CNPJ/Email/Aleatória)
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  asaasCustomerId?: string; // ID do Cliente no Asaas para mensalidade do ServiceZap
  // Dados de Emissão de Nota Fiscal (Focus NFe)
  taxRegime?: 'simples_nacional' | 'lucro_presumido' | 'mei';
  municipalRegistration?: string; // Inscrição Municipal
  issRate?: number; // Alíquota ISS (%)
}

// 2. Serviço / Produto do Catálogo
export interface ServiceDocument extends Models.Document {
  tenantId: string;
  name: string;
  description?: string;
  price: number; // Preço padrão em R$
  durationMinutes: number; // Duração estimada em minutos
  category: string; // Ex: Estética, Odontologia, Consulta, Suporte
  active: boolean;
}

// 3. Usuário (Vinculado a um Tenant)
export interface UserDocument extends Models.Document {
  userId: string; // Appwrite Auth User ID
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
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
  dueDate?: string; // Validade do orçamento ou previsão de execução da OS
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




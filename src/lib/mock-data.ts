import {
  InvoiceDocument,
  TenantDocument,
  WhatsAppInstanceDocument,
  ServiceDocument,
  ClientDocument,
  WorkOrderDocument,
  QuickReplyDocument,
  LabelDocument,
  AppointmentDocument,
} from '@/types/appwrite';

export const mockTenant: Partial<TenantDocument> = {
  $id: 'tenant_01',
  name: 'Minha Empresa',
  companyName: 'Minha Empresa Prestadora de Serviços Ltda',
  document: '',
  email: '',
  phone: '',
  plan: 'pro',
  status: 'active',
  pixKey: '',
  pixKeyType: 'cnpj',
  asaasCustomerId: '',
  taxRegime: 'simples_nacional',
  municipalRegistration: '',
  issRate: 2.0,
};

export const mockWhatsAppInstance: Partial<WhatsAppInstanceDocument> = {
  $id: 'wa_01',
  tenantId: 'tenant_01',
  instanceName: 'ServiceZap WhatsApp',
  instanceId: 'inst_default',
  status: 'disconnected',
  phone: '',
  updatedAt: new Date().toISOString(),
};

export const mockClients: Partial<ClientDocument>[] = [];

export const mockServices: Partial<ServiceDocument>[] = [];

export const mockInvoices: Partial<InvoiceDocument>[] = [];

export const mockWorkOrders: Partial<WorkOrderDocument>[] = [];

// Rótulos padrão / Mock
export const mockLabels: Partial<LabelDocument>[] = [];

// Mensagens Rápidas / Mock
export const mockQuickReplies: Partial<QuickReplyDocument>[] = [];

// Agendamentos de Atendimento / Mock
export const mockAppointments: Partial<AppointmentDocument>[] = [];

// Lista de Empresas / Mock para Super Admin
export const mockTenantsList: Partial<TenantDocument>[] = [
  {
    $id: 'tenant_01',
    name: 'ServiceZap Matriz',
    companyName: 'ServiceZap Soluções Digitais LTDA',
    document: '12.345.678/0001-90',
    email: 'contato@servicezap.com',
    phone: '(11) 98765-4321',
    plan: 'pro',
    status: 'active',
    maxUsers: 5,
    ownerName: 'Flavio Dias',
    ownerEmail: 'flavio@servicezap.com',
    $createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    $id: 'tenant_02',
    name: 'EletroMax Serviços',
    companyName: 'EletroMax Instalações Elétricas MEI',
    document: '98.765.432/0001-10',
    email: 'contato@eletromax.com',
    phone: '(63) 98491-3860',
    plan: 'starter',
    status: 'active',
    maxUsers: 2,
    ownerName: 'Marcos Silva',
    ownerEmail: 'marcos@eletromax.com',
    $createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    $id: 'tenant_03',
    name: 'Clínica Bella Estética',
    companyName: 'Bella Estética Avançada LTDA',
    document: '45.678.910/0001-22',
    email: 'gestao@bellaestetica.com',
    phone: '(11) 97777-8888',
    plan: 'enterprise',
    status: 'active',
    maxUsers: 15,
    ownerName: 'Dra. Camila Duarte',
    ownerEmail: 'camila@bellaestetica.com',
    $createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

// Membros da Equipe / Mock
export const mockTeamUsers = [
  {
    $id: 'usr_01',
    userId: 'auth_usr_01',
    tenantId: 'tenant_01',
    name: 'Flavio Dias (Você)',
    email: 'flavio@servicezap.com',
    phone: '(63) 98491-3860',
    role: 'owner',
    active: true,
    permissions: {
      canManageAppointments: true,
      canManageWorkOrders: true,
      canManageInvoices: true,
      canManageWhatsApp: true,
      canManageServices: true,
      canManageClients: true,
      canManageFiscal: true,
      canViewReports: true,
      canManageTeam: true,
    },
    $createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    $id: 'usr_02',
    userId: 'auth_usr_02',
    tenantId: 'tenant_01',
    name: 'Ana Carolina (Atendente)',
    email: 'ana.atendimento@servicezap.com',
    phone: '(11) 98888-1111',
    role: 'user',
    active: true,
    permissions: {
      canManageAppointments: true,
      canManageWorkOrders: true,
      canManageInvoices: false,
      canManageWhatsApp: true,
      canManageServices: false,
      canManageClients: true,
      canManageFiscal: false,
      canViewReports: false,
      canManageTeam: false,
    },
    $createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    $id: 'usr_03',
    userId: 'auth_usr_03',
    tenantId: 'tenant_01',
    name: 'Carlos Alberto (Técnico Externo)',
    email: 'carlos.tecnico@servicezap.com',
    phone: '(11) 98888-2222',
    role: 'user',
    active: true,
    permissions: {
      canManageAppointments: true,
      canManageWorkOrders: true,
      canManageInvoices: false,
      canManageWhatsApp: false,
      canManageServices: false,
      canManageClients: true,
      canManageFiscal: false,
      canViewReports: false,
      canManageTeam: false,
    },
    $createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

// Logs de Auditoria / Mock
export const mockAuditLogs = [
  {
    $id: 'log_01',
    tenantId: 'tenant_01',
    userId: 'usr_01',
    userName: 'Flavio Dias',
    userEmail: 'flavio@servicezap.com',
    userRole: 'owner',
    action: 'work_order.create',
    category: 'work_orders',
    entityId: 'wo_01',
    entityName: 'Orçamento ORC-2026-001',
    details: 'Criou proposta no valor de R$ 350,00 para o cliente João Silva.',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    $id: 'log_02',
    tenantId: 'tenant_01',
    userId: 'usr_02',
    userName: 'Ana Carolina',
    userEmail: 'ana.atendimento@servicezap.com',
    userRole: 'user',
    action: 'appointment.create',
    category: 'appointments',
    entityId: 'apt_01',
    entityName: 'Agendamento - Maria Santos',
    details: 'Agendou atendimento para 08/09/2026 às 14:00.',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    $id: 'log_03',
    tenantId: 'tenant_01',
    userId: 'usr_01',
    userName: 'Flavio Dias',
    userEmail: 'flavio@servicezap.com',
    userRole: 'owner',
    action: 'invoice.create',
    category: 'invoices',
    entityId: 'inv_01',
    entityName: 'Cobrança PIX #FAT-001',
    details: 'Emitiu cobrança PIX no valor de R$ 450,00 via Asaas.',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    $id: 'log_04',
    tenantId: 'tenant_01',
    userId: 'usr_01',
    userName: 'Flavio Dias',
    userEmail: 'flavio@servicezap.com',
    userRole: 'owner',
    action: 'user.permissions_update',
    category: 'team',
    entityId: 'usr_02',
    entityName: 'Ana Carolina',
    details: 'Habilitou permissão de gerenciar Ordens de Serviço.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export interface PlanDefinition {
  id: string;
  name: string;
  badge?: string;
  description: string;
  popular?: boolean;
  priceMonthly: number;
  priceYearly: number; // Valor com desconto (ex: 2 meses grátis)
  limits: {
    maxUsers: number;                // Limite de colaboradores na equipe
    maxAppointmentsPerMonth: number; // Agendamentos mensais (Infinity = ilimitado)
    maxWorkOrdersPerMonth: number;   // O.S. criadas por mês
    maxClients: number;              // Quantidade máxima de clientes no CRM
    maxWhatsAppInstances: number;    // Números de WhatsApp conectados
  };
  features: {
    hasNfe: boolean;                 // Emissão de NF-e (Focus NFe)
    hasWhatsAppBroadcast: boolean;   // Disparo em lote por etiquetas
    hasAuditLogs: boolean;           // Trilha de auditoria para o Admin
    hasCustomPdfBranding: boolean;   // Logo e cabeçalho customizados nos PDFs
    hasMultipleAttendants: boolean;  // Atribuição de técnicos específicos por agenda
    hasFinancialReports: boolean;    // DRE, LTV e métricas financeiras avançadas
    hasApiAccess: boolean;           // Acesso a Webhooks e API aberta
  };
  featureList: string[];
}

export const SAAS_PLANS: Record<string, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Grátis / Teste',
    badge: '14 Dias Grátis',
    description: 'Ideal para autônomos testarem a plataforma e emitirem suas primeiras propostas.',
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      maxUsers: 1,
      maxAppointmentsPerMonth: 15,
      maxWorkOrdersPerMonth: 10,
      maxClients: 25,
      maxWhatsAppInstances: 1,
    },
    features: {
      hasNfe: false,
      hasWhatsAppBroadcast: false,
      hasAuditLogs: false,
      hasCustomPdfBranding: false,
      hasMultipleAttendants: false,
      hasFinancialReports: false,
      hasApiAccess: false,
    },
    featureList: [
      '1 Usuário (Proprietário)',
      'Até 15 agendamentos/mês',
      'Até 10 Orçamentos & O.S./mês',
      'Até 25 clientes no CRM',
      '1 Conexão de WhatsApp',
      'Geração de Recibos em PDF',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter (Solo)',
    badge: 'Autônomo',
    description: 'Para profissionais individuais que precisam de fluxo ilimitado de serviços e recebimento PIX.',
    priceMonthly: 49.9,
    priceYearly: 490.0,
    limits: {
      maxUsers: 2,
      maxAppointmentsPerMonth: Infinity,
      maxWorkOrdersPerMonth: Infinity,
      maxClients: 500,
      maxWhatsAppInstances: 1,
    },
    features: {
      hasNfe: false,
      hasWhatsAppBroadcast: false,
      hasAuditLogs: false,
      hasCustomPdfBranding: true,
      hasMultipleAttendants: false,
      hasFinancialReports: true,
      hasApiAccess: false,
    },
    featureList: [
      'Até 2 Usuários (Dono + 1 Atendente)',
      'Agendamentos & O.S. Ilimitados',
      'Até 500 clientes no CRM',
      'Cobrança PIX com QR Code dinâmico',
      'Lembretes automáticos no WhatsApp',
      'PDFs com logo e marca personalizada',
      'Relatórios básicos de faturamento',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro (Empresa)',
    badge: 'Mais Popular',
    popular: true,
    description: 'Para empresas e clínicas que trabalham com equipe, emissão de NF-e e mensagens em massa.',
    priceMonthly: 99.9,
    priceYearly: 990.0,
    limits: {
      maxUsers: 5,
      maxAppointmentsPerMonth: Infinity,
      maxWorkOrdersPerMonth: Infinity,
      maxClients: 2000,
      maxWhatsAppInstances: 1,
    },
    features: {
      hasNfe: true,
      hasWhatsAppBroadcast: true,
      hasAuditLogs: true,
      hasCustomPdfBranding: true,
      hasMultipleAttendants: true,
      hasFinancialReports: true,
      hasApiAccess: false,
    },
    featureList: [
      'Até 5 Usuários com Controle de Acesso (RBAC)',
      'Emissão automática de Nota Fiscal (Focus NFe)',
      'Disparo em lote por etiquetas no WhatsApp',
      'Trilha de Auditoria completa de colaboradores',
      'Múltiplas agendas e técnicos por serviço',
      'DRE e métricas completas de LTV',
      'Suporte prioritário via WhatsApp',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise (Escala)',
    badge: 'Corporativo',
    description: 'Para redes, franquias e operações de alto volume com múltiplas linhas de WhatsApp e API.',
    priceMonthly: 199.9,
    priceYearly: 1990.0,
    limits: {
      maxUsers: Infinity,
      maxAppointmentsPerMonth: Infinity,
      maxWorkOrdersPerMonth: Infinity,
      maxClients: Infinity,
      maxWhatsAppInstances: 3,
    },
    features: {
      hasNfe: true,
      hasWhatsAppBroadcast: true,
      hasAuditLogs: true,
      hasCustomPdfBranding: true,
      hasMultipleAttendants: true,
      hasFinancialReports: true,
      hasApiAccess: true,
    },
    featureList: [
      'Usuários e Colaboradores Ilimitados',
      'Até 3 Números de WhatsApp conectados',
      'Emissão de NF-e e Auditoria Ilimitadas',
      'Acesso à API & Webhooks personalizados',
      'Conciliação bancária avançada',
      'Gerente de conta e suporte VIP 24/7',
    ],
  },
};

export function getPlanDetails(planId?: string): PlanDefinition {
  return SAAS_PLANS[planId || 'pro'] || SAAS_PLANS.pro;
}

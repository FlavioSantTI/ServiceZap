'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { TenantDocument, TenantStatus, UserDocument, DEFAULT_ADMIN_PERMISSIONS } from '@/types/appwrite';
import { mockTenantsList } from '@/lib/mock-data';
import { logAuditEvent } from '@/lib/services/auditService';
import { revalidatePath } from 'next/cache';
import { Query, ID } from 'node-appwrite';
import { SAAS_PLANS } from '@/lib/constants/plans';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_TENANTS = process.env.APPWRITE_COLLECTION_TENANTS || 'tenants';
const COLLECTION_USERS = process.env.APPWRITE_COLLECTION_USERS || 'users';

export interface CreateTenantInput {
  name: string;
  companyName?: string;
  personType?: 'pf' | 'pj';
  document: string;
  email: string;
  phone?: string;
  plan: string;
  status?: TenantStatus;
  maxUsers?: number;
  ownerName: string;
  ownerEmail: string;
  adminPassword?: string;
}

export async function fetchTenantsAction(): Promise<TenantDocument[]> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return JSON.parse(JSON.stringify(mockTenantsList));
    }

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_TENANTS,
      [Query.orderDesc('$createdAt'), Query.limit(100)]
    );

    if (response.documents.length === 0) {
      return JSON.parse(JSON.stringify(mockTenantsList));
    }

    return JSON.parse(JSON.stringify(response.documents)) as TenantDocument[];
  } catch (error) {
    console.warn('⚠️ Fallback para mockTenantsList:', error);
    return JSON.parse(JSON.stringify(mockTenantsList));
  }
}

export async function createTenantAction(input: CreateTenantInput): Promise<{ success: boolean; tenant?: any; error?: string }> {
  try {
    const tenantId = `tenant_${Date.now()}`;
    const planConfig = SAAS_PLANS[input.plan] || SAAS_PLANS.free;
    const maxUsers = input.maxUsers || planConfig.limits.maxUsers;

    const tenantPayload = {
      name: input.name,
      companyName: input.companyName || input.name,
      personType: input.personType || 'pj',
      document: input.document,
      email: input.email,
      phone: input.phone || '',
      plan: input.plan,
      status: (input.status || 'active') as TenantStatus,
      maxUsers,
      ownerName: input.ownerName,
      ownerEmail: input.ownerEmail,
    };

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const newTenant = {
        $id: tenantId,
        $createdAt: new Date().toISOString(),
        ...tenantPayload,
      };
      
      await logAuditEvent({
        tenantId: 'super_admin_system',
        action: 'super_admin.tenant_create',
        category: 'super_admin',
        entityId: tenantId,
        entityName: input.name,
        details: `Super Admin cadastrou a empresa ${input.name} no plano ${input.plan.toUpperCase()} com Admin ${input.ownerEmail}.`,
      });

      revalidatePath('/super-admin');
      revalidatePath('/super-admin/tenants');
      return { success: true, tenant: newTenant };
    }

    const { databases, users } = await createAdminClient();

    // 1. Criar Documento do Tenant
    const createdTenant = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_TENANTS,
      ID.unique(),
      tenantPayload
    );

    // 2. Criar Auth User no Appwrite para o Dono/Admin da empresa
    let authUserId = ID.unique();
    try {
      const authUser = await users.create(
        ID.unique(),
        input.ownerEmail,
        input.phone || undefined,
        input.adminPassword || 'ServiceZap@2026',
        input.ownerName
      );
      authUserId = authUser.$id;
    } catch (e: any) {
      console.warn('⚠️ Usuário auth pode já existir ou falhou:', e.message);
    }

    // 3. Vincular usuário na coleção `users` com Role 'owner' ou 'admin'
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_USERS,
        ID.unique(),
        {
          userId: authUserId,
          tenantId: createdTenant.$id,
          name: input.ownerName,
          email: input.ownerEmail,
          phone: input.phone || '',
          role: 'owner',
          active: true,
          permissionsJson: JSON.stringify(DEFAULT_ADMIN_PERMISSIONS),
        }
      );
    } catch (e) {
      console.warn('⚠️ Falha ao criar registro na tabela users:', e);
    }

    // 4. Log de auditoria
    await logAuditEvent({
      tenantId: createdTenant.$id,
      action: 'super_admin.tenant_create',
      category: 'super_admin',
      entityId: createdTenant.$id,
      entityName: input.name,
      details: `Empresa ${input.name} cadastrada com sucesso. Administrador: ${input.ownerEmail}.`,
    });

    revalidatePath('/super-admin');
    revalidatePath('/super-admin/tenants');
    return { success: true, tenant: JSON.parse(JSON.stringify(createdTenant)) };
  } catch (error: any) {
    console.error('❌ Erro ao cadastrar tenant:', error);
    return { success: false, error: error.message || 'Erro ao cadastrar tenant' };
  }
}

export interface UpdateTenantInput {
  tenantId: string;
  name: string;
  companyName?: string;
  personType?: 'pf' | 'pj';
  document: string;
  email?: string;
  phone?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise' | string;
  maxUsers: number;
  ownerName: string;
  ownerEmail: string;
  status?: TenantStatus;
}

export async function updateTenantAction(input: UpdateTenantInput): Promise<{ success: boolean; tenant?: any; error?: string }> {
  try {
    const planConfig = SAAS_PLANS[input.plan] || SAAS_PLANS.free;
    const maxUsers = input.maxUsers || planConfig.limits.maxUsers;

    const payload: any = {
      name: input.name,
      companyName: input.companyName || input.name,
      personType: input.personType || 'pj',
      document: input.document,
      email: input.email || input.ownerEmail,
      phone: input.phone || '',
      plan: input.plan,
      maxUsers,
      ownerName: input.ownerName,
      ownerEmail: input.ownerEmail,
    };

    if (input.status) {
      payload.status = input.status;
    }

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      await logAuditEvent({
        tenantId: input.tenantId,
        action: 'super_admin.tenant_update',
        category: 'super_admin',
        entityId: input.tenantId,
        entityName: input.name,
        details: `Empresa ${input.name} atualizada pelo Super Admin.`,
      });
      revalidatePath('/super-admin');
      revalidatePath('/super-admin/tenants');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_TENANTS,
      input.tenantId,
      payload
    );

    await logAuditEvent({
      tenantId: input.tenantId,
      action: 'super_admin.tenant_update',
      category: 'super_admin',
      entityId: input.tenantId,
      entityName: input.name,
      details: `Empresa ${input.name} atualizada pelo Super Admin.`,
    });

    revalidatePath('/super-admin');
    revalidatePath('/super-admin/tenants');
    return { success: true, tenant: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error('❌ Erro ao atualizar tenant:', error);
    return { success: false, error: error.message || 'Erro ao atualizar empresa' };
  }
}

export async function deleteTenantAction(
  tenantId: string,
  mode: 'soft' | 'hard' = 'soft'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      await logAuditEvent({
        tenantId,
        action: mode === 'soft' ? 'super_admin.tenant_archive' : 'super_admin.tenant_delete',
        category: 'super_admin',
        entityId: tenantId,
        details: mode === 'soft'
          ? `Empresa ${tenantId} cancelada/arquivada com preservação de mensagens e logs.`
          : `Empresa ${tenantId} expurgada definitivamente do sistema.`,
      });
      revalidatePath('/super-admin');
      revalidatePath('/super-admin/tenants');
      return { success: true };
    }

    const { databases } = await createAdminClient();

    if (mode === 'soft') {
      // 1. Soft Delete (Recomendado): Altera status para 'canceled'
      // Preserva integralmente todas as mensagens, histórico de faturas e logs para auditoria/fisco
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_TENANTS,
        tenantId,
        { status: 'canceled' }
      );

      // Desativa usuários vinculados a este tenant
      try {
        const usersList = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_USERS,
          [Query.equal('tenantId', tenantId), Query.limit(100)]
        );
        for (const userDoc of usersList.documents) {
          await databases.updateDocument(DATABASE_ID, COLLECTION_USERS, userDoc.$id, { active: false });
        }
      } catch (e) {
        console.warn('⚠️ Aviso ao desativar usuários do tenant cancelado:', e);
      }

      await logAuditEvent({
        tenantId,
        action: 'super_admin.tenant_archive',
        category: 'super_admin',
        entityId: tenantId,
        details: `Empresa ${tenantId} cancelada/arquivada. Mensagens e histórico preservados com segurança.`,
      });
    } else {
      // 2. Hard Delete: Expurgo definitivo do tenant
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_TENANTS,
        tenantId
      );

      await logAuditEvent({
        tenantId: 'super_admin_system',
        action: 'super_admin.tenant_delete',
        category: 'super_admin',
        entityId: tenantId,
        details: `Empresa ${tenantId} expurgada definitivamente pelo Super Admin.`,
      });
    }

    revalidatePath('/super-admin');
    revalidatePath('/super-admin/tenants');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao processar exclusão do tenant:', error);
    return { success: false, error: error.message || 'Erro ao processar exclusão da empresa' };
  }
}

export async function updateTenantStatusAction(tenantId: string, status: TenantStatus): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      await logAuditEvent({
        tenantId,
        action: 'super_admin.tenant_status_update',
        category: 'super_admin',
        entityId: tenantId,
        details: `Status do tenant alterado para: ${status.toUpperCase()}`,
      });
      revalidatePath('/super-admin');
      revalidatePath('/super-admin/tenants');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_TENANTS,
      tenantId,
      { status }
    );

    await logAuditEvent({
      tenantId,
      action: 'super_admin.tenant_status_update',
      category: 'super_admin',
      entityId: tenantId,
      details: `Status do tenant alterado para: ${status.toUpperCase()}`,
    });

    revalidatePath('/super-admin');
    revalidatePath('/super-admin/tenants');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao atualizar status do tenant:', error);
    return { success: false, error: error.message || 'Erro ao atualizar status' };
  }
}

export async function updateTenantPlanAction(
  tenantId: string,
  plan: 'free' | 'starter' | 'pro' | 'enterprise',
  maxUsers?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const planConfig = SAAS_PLANS[plan] || SAAS_PLANS.free;
    const resolvedMaxUsers = maxUsers || planConfig.limits.maxUsers;

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      await logAuditEvent({
        tenantId,
        action: 'super_admin.tenant_plan_update',
        category: 'super_admin',
        entityId: tenantId,
        details: `Plano atualizado para ${plan.toUpperCase()} (Limite: ${resolvedMaxUsers} usuários).`,
      });
      revalidatePath('/super-admin');
      revalidatePath('/super-admin/tenants');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_TENANTS,
      tenantId,
      {
        plan,
        maxUsers: resolvedMaxUsers,
      }
    );

    await logAuditEvent({
      tenantId,
      action: 'super_admin.tenant_plan_update',
      category: 'super_admin',
      entityId: tenantId,
      details: `Plano atualizado para ${plan.toUpperCase()} (Limite: ${resolvedMaxUsers} usuários).`,
    });

    revalidatePath('/super-admin');
    revalidatePath('/super-admin/tenants');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao atualizar plano do tenant:', error);
    return { success: false, error: error.message || 'Erro ao atualizar plano' };
  }
}

export async function getSuperAdminMetricsAction() {
  const tenants = await fetchTenantsAction();
  
  let activeTenants = 0;
  let mrr = 0;
  let totalUsersLimit = 0;
  const planDistribution: Record<string, number> = {
    free: 0,
    starter: 0,
    pro: 0,
    enterprise: 0,
  };

  tenants.forEach((t) => {
    if (t.status === 'active' || t.status === 'trialing' || t.status === 'trial') {
      activeTenants++;
    }
    const planKey = (t.plan || 'free').toLowerCase();
    planDistribution[planKey] = (planDistribution[planKey] || 0) + 1;
    
    const planConfig = SAAS_PLANS[planKey];
    if (planConfig && (t.status === 'active' || t.status === 'past_due')) {
      mrr += planConfig.priceMonthly;
    }
    totalUsersLimit += (t.maxUsers || 1);
  });

  return {
    totalTenants: tenants.length,
    activeTenants,
    mrr,
    totalUsersLimit,
    planDistribution,
  };
}

// Armazenamento em memória / cache dinâmico de planos quando sem Appwrite
let dynamicPlansStore: Record<string, any> = { ...SAAS_PLANS };

const COLLECTION_PLANS = process.env.APPWRITE_COLLECTION_PLANS || 'saas_plans';

export async function fetchSaasPlansAction(): Promise<any[]> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return Object.values(dynamicPlansStore);
    }

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_PLANS,
      [Query.limit(50)]
    );

    if (response.documents.length === 0) {
      return Object.values(dynamicPlansStore);
    }

    const parsedPlans = response.documents.map((doc: any) => {
      let limits = doc.limits;
      let features = doc.features;
      let featureList = doc.featureList;

      if (typeof doc.limitsJson === 'string') {
        try { limits = JSON.parse(doc.limitsJson); } catch (e) {}
      }
      if (typeof doc.featuresJson === 'string') {
        try { features = JSON.parse(doc.featuresJson); } catch (e) {}
      }
      if (typeof doc.featureListJson === 'string') {
        try { featureList = JSON.parse(doc.featureListJson); } catch (e) {}
      }

      return {
        ...doc,
        id: doc.planId || doc.$id,
        limits: limits || {},
        features: features || {},
        featureList: featureList || [],
      };
    });

    return JSON.parse(JSON.stringify(parsedPlans));
  } catch (error) {
    console.warn('⚠️ Fallback para dynamicPlansStore:', error);
    return Object.values(dynamicPlansStore);
  }
}

export async function saveSaasPlanAction(planData: any): Promise<{ success: boolean; plan?: any; error?: string }> {
  try {
    const planId = planData.id || `plan_${Date.now()}`;
    const normalizedPlan = {
      ...planData,
      id: planId,
    };

    dynamicPlansStore[planId] = normalizedPlan;

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      await logAuditEvent({
        tenantId: 'super_admin_system',
        action: 'super_admin.plan_save',
        category: 'super_admin',
        entityId: planId,
        entityName: planData.name,
        details: `Plano SaaS ${planData.name} salvo/atualizado (R$ ${planData.priceMonthly}/mês).`,
      });

      revalidatePath('/super-admin');
      revalidatePath('/super-admin/plans');
      revalidatePath('/dashboard/subscription');
      return { success: true, plan: normalizedPlan };
    }

    const { databases } = await createAdminClient();

    const payload = {
      planId: planId,
      name: planData.name,
      badge: planData.badge || '',
      description: planData.description || '',
      popular: !!planData.popular,
      priceMonthly: Number(planData.priceMonthly) || 0,
      priceYearly: Number(planData.priceYearly) || 0,
      limitsJson: JSON.stringify(planData.limits || {}),
      featuresJson: JSON.stringify(planData.features || {}),
      featureListJson: JSON.stringify(planData.featureList || []),
    };

    // Tenta atualizar ou criar
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTION_PLANS, planId, payload);
    } catch (e) {
      await databases.createDocument(DATABASE_ID, COLLECTION_PLANS, planId, payload);
    }

    await logAuditEvent({
      tenantId: 'super_admin_system',
      action: 'super_admin.plan_save',
      category: 'super_admin',
      entityId: planId,
      entityName: planData.name,
      details: `Plano SaaS ${planData.name} gravado no Appwrite.`,
    });

    revalidatePath('/super-admin');
    revalidatePath('/super-admin/plans');
    revalidatePath('/dashboard/subscription');
    return { success: true, plan: normalizedPlan };
  } catch (error: any) {
    console.error('❌ Erro ao salvar plano SaaS:', error);
    return { success: false, error: error.message || 'Erro ao salvar plano' };
  }
}

export async function deleteSaasPlanAction(planId: string): Promise<{ success: boolean; error?: string }> {
  try {
    delete dynamicPlansStore[planId];

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/super-admin/plans');
      revalidatePath('/dashboard/subscription');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    await databases.deleteDocument(DATABASE_ID, COLLECTION_PLANS, planId);

    revalidatePath('/super-admin/plans');
    revalidatePath('/dashboard/subscription');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao excluir plano:', error);
    return { success: false, error: error.message || 'Erro ao excluir plano' };
  }
}


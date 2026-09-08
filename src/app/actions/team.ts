'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { UserDocument, UserPermissions, UserRole, DEFAULT_USER_PERMISSIONS } from '@/types/appwrite';
import { mockTeamUsers, mockTenant } from '@/lib/mock-data';
import { logAuditEvent } from '@/lib/services/auditService';
import { checkResourceLimit } from '@/lib/services/planEnforcer';
import { revalidatePath } from 'next/cache';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_USERS = process.env.APPWRITE_COLLECTION_USERS || 'users';
const COLLECTION_TENANTS = process.env.APPWRITE_COLLECTION_TENANTS || 'tenants';

export interface CreateTeamMemberInput {
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password?: string;
  permissions: UserPermissions;
}

export async function fetchTeamMembersAction(tenantId: string = 'tenant_01'): Promise<UserDocument[]> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return JSON.parse(JSON.stringify(mockTeamUsers)) as any;
    }

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_USERS,
      [Query.equal('tenantId', tenantId), Query.orderAsc('$createdAt')]
    );

    if (response.documents.length === 0) {
      return JSON.parse(JSON.stringify(mockTeamUsers)) as any;
    }

    // Normaliza permissões de string JSON para objeto se necessário
    const users = response.documents.map((doc: any) => {
      let permissions = doc.permissions;
      if (!permissions && doc.permissionsJson) {
        try {
          permissions = JSON.parse(doc.permissionsJson);
        } catch (e) {
          permissions = DEFAULT_USER_PERMISSIONS;
        }
      }
      return {
        ...doc,
        permissions: permissions || DEFAULT_USER_PERMISSIONS,
      };
    });

    return JSON.parse(JSON.stringify(users)) as UserDocument[];
  } catch (error) {
    console.warn('⚠️ Fallback para mockTeamUsers:', error);
    return JSON.parse(JSON.stringify(mockTeamUsers)) as any;
  }
}

export async function createTeamMemberAction(input: CreateTeamMemberInput): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  upgradeRequired?: boolean;
}> {
  try {
    // 1. Validar limite de usuários pelo plano do tenant
    const currentMembers = await fetchTeamMembersAction(input.tenantId);
    
    // Obter plano do tenant
    let tenantPlan = mockTenant.plan;
    let maxUsersLimit = mockTenant.maxUsers || 2;

    if (process.env.APPWRITE_API_KEY && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      try {
        const { databases } = await createAdminClient();
        const tenantDoc: any = await databases.getDocument(DATABASE_ID, COLLECTION_TENANTS, input.tenantId);
        tenantPlan = tenantDoc.plan;
        maxUsersLimit = tenantDoc.maxUsers || maxUsersLimit;
      } catch (e) {
        // Usa o fallback
      }
    }

    const limitCheck = checkResourceLimit(tenantPlan, 'maxUsers', currentMembers.length);
    if (!limitCheck.allowed && currentMembers.length >= maxUsersLimit) {
      return {
        success: false,
        error: `Seu plano atual permite no máximo ${maxUsersLimit} colaboradores. Faça um upgrade para adicionar mais membros.`,
        upgradeRequired: true,
      };
    }

    const userPayload = {
      tenantId: input.tenantId,
      name: input.name,
      email: input.email,
      phone: input.phone || '',
      role: input.role || 'user',
      active: true,
      permissionsJson: JSON.stringify(input.permissions),
    };

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const newUser = {
        $id: `usr_${Date.now()}`,
        userId: `auth_${Date.now()}`,
        $createdAt: new Date().toISOString(),
        permissions: input.permissions,
        ...userPayload,
      };

      await logAuditEvent({
        tenantId: input.tenantId,
        action: 'user.create',
        category: 'team',
        entityId: newUser.$id,
        entityName: input.name,
        details: `Novo colaborador ${input.name} (${input.email}) adicionado com perfil ${input.role.toUpperCase()}.`,
      });

      revalidatePath('/dashboard/team');
      return { success: true, user: newUser };
    }

    const { databases, users } = await createAdminClient();

    // Cria conta de autenticação
    let authUserId = ID.unique();
    try {
      const authUser = await users.create(
        ID.unique(),
        input.email,
        input.phone || undefined,
        input.password || 'Mudar@2026',
        input.name
      );
      authUserId = authUser.$id;
    } catch (e: any) {
      console.warn('⚠️ Usuário auth já pode existir:', e.message);
    }

    const createdDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_USERS,
      ID.unique(),
      {
        userId: authUserId,
        ...userPayload,
      }
    );

    await logAuditEvent({
      tenantId: input.tenantId,
      action: 'user.create',
      category: 'team',
      entityId: createdDoc.$id,
      entityName: input.name,
      details: `Novo colaborador ${input.name} (${input.email}) cadastrado na equipe.`,
    });

    revalidatePath('/dashboard/team');
    return {
      success: true,
      user: {
        ...JSON.parse(JSON.stringify(createdDoc)),
        permissions: input.permissions,
      },
    };
  } catch (error: any) {
    console.error('❌ Erro ao adicionar colaborador:', error);
    return { success: false, error: error.message || 'Erro ao adicionar membro na equipe' };
  }
}

export async function updateTeamMemberPermissionsAction(
  memberId: string,
  tenantId: string,
  permissions: UserPermissions,
  role?: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      permissionsJson: JSON.stringify(permissions),
    };
    if (role) {
      updateData.role = role;
    }

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      await logAuditEvent({
        tenantId,
        action: 'user.permissions_update',
        category: 'team',
        entityId: memberId,
        details: `Permissões do usuário atualizadas com sucesso. Role: ${role || 'inalterada'}.`,
      });
      revalidatePath('/dashboard/team');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_USERS,
      memberId,
      updateData
    );

    await logAuditEvent({
      tenantId,
      action: 'user.permissions_update',
      category: 'team',
      entityId: memberId,
      details: `Permissões do usuário atualizadas pelo Administrador.`,
    });

    revalidatePath('/dashboard/team');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao atualizar permissões:', error);
    return { success: false, error: error.message || 'Erro ao salvar permissões' };
  }
}

export async function updateTeamMemberStatusAction(
  memberId: string,
  tenantId: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      await logAuditEvent({
        tenantId,
        action: 'user.status_update',
        category: 'team',
        entityId: memberId,
        details: `Colaborador ${active ? 'reativado' : 'suspenso / desativado'}.`,
      });
      revalidatePath('/dashboard/team');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_USERS,
      memberId,
      { active }
    );

    await logAuditEvent({
      tenantId,
      action: 'user.status_update',
      category: 'team',
      entityId: memberId,
      details: `Status do colaborador alterado para: ${active ? 'Ativo' : 'Inativo'}.`,
    });

    revalidatePath('/dashboard/team');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao alterar status do colaborador:', error);
    return { success: false, error: error.message || 'Erro ao alterar status' };
  }
}

export async function deleteTeamMemberAction(
  memberId: string,
  tenantId: string,
  memberName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      await logAuditEvent({
        tenantId,
        action: 'user.delete',
        category: 'team',
        entityId: memberId,
        entityName: memberName,
        details: `Colaborador ${memberName} removido da empresa.`,
      });
      revalidatePath('/dashboard/team');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    await databases.deleteDocument(DATABASE_ID, COLLECTION_USERS, memberId);

    await logAuditEvent({
      tenantId,
      action: 'user.delete',
      category: 'team',
      entityId: memberId,
      entityName: memberName,
      details: `Colaborador ${memberName} excluído da base.`,
    });

    revalidatePath('/dashboard/team');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao excluir membro:', error);
    return { success: false, error: error.message || 'Erro ao remover colaborador' };
  }
}

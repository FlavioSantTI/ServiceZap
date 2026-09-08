import { createAdminClient } from '@/lib/appwrite/server';
import { AuditCategory, AuditLogDocument } from '@/types/appwrite';
import { ID } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_AUDIT_LOGS = process.env.APPWRITE_COLLECTION_AUDIT_LOGS || 'audit_logs';

export interface AuditLogParams {
  tenantId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  category: AuditCategory;
  entityId?: string;
  entityName?: string;
  details?: string;
  ipAddress?: string;
}

/**
 * Registra um evento de auditoria no Appwrite de forma segura (silenciosa para não quebrar a ação principal).
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      console.log('📝 [Audit Log Mock]:', params.action, `(${params.category})`, params.details || '');
      return;
    }

    const { databases } = await createAdminClient();

    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_AUDIT_LOGS,
      ID.unique(),
      {
        tenantId: params.tenantId || 'tenant_01',
        userId: params.userId || 'usr_system',
        userName: params.userName || 'Sistema / Usuário',
        userEmail: params.userEmail || 'sistema@servicezap.com',
        userRole: params.userRole || 'admin',
        action: params.action,
        category: params.category,
        entityId: params.entityId || '',
        entityName: params.entityName || '',
        details: params.details || '',
        ipAddress: params.ipAddress || '',
        created_at: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('⚠️ Falha ao registrar log de auditoria no Appwrite:', error);
  }
}

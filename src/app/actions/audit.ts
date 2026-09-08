'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { AuditCategory, AuditLogDocument } from '@/types/appwrite';
import { mockAuditLogs } from '@/lib/mock-data';
import { Query } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_AUDIT_LOGS = process.env.APPWRITE_COLLECTION_AUDIT_LOGS || 'audit_logs';

export interface FetchAuditLogsFilters {
  tenantId?: string;
  category?: AuditCategory | 'all';
  userId?: string;
  searchQuery?: string;
  limit?: number;
}

export async function fetchAuditLogsAction(
  filters: FetchAuditLogsFilters = {}
): Promise<AuditLogDocument[]> {
  try {
    const tenantId = filters.tenantId || 'tenant_01';

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      let logs = [...mockAuditLogs] as any[];
      
      if (filters.category && filters.category !== 'all') {
        logs = logs.filter((l) => l.category === filters.category);
      }
      if (filters.userId && filters.userId !== 'all') {
        logs = logs.filter((l) => l.userId === filters.userId);
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        logs = logs.filter(
          (l) =>
            l.action.toLowerCase().includes(query) ||
            l.userName.toLowerCase().includes(query) ||
            (l.details && l.details.toLowerCase().includes(query)) ||
            (l.entityName && l.entityName.toLowerCase().includes(query))
        );
      }
      return JSON.parse(JSON.stringify(logs)) as AuditLogDocument[];
    }

    const { databases } = await createAdminClient();
    const queries: string[] = [
      Query.equal('tenantId', tenantId),
      Query.orderDesc('$createdAt'),
      Query.limit(filters.limit || 100),
    ];

    if (filters.category && filters.category !== 'all') {
      queries.push(Query.equal('category', filters.category));
    }
    if (filters.userId && filters.userId !== 'all') {
      queries.push(Query.equal('userId', filters.userId));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_AUDIT_LOGS,
      queries
    );

    if (response.documents.length === 0) {
      return JSON.parse(JSON.stringify(mockAuditLogs)) as any;
    }

    let logs = response.documents;
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      logs = logs.filter(
        (l: any) =>
          (l.action && l.action.toLowerCase().includes(query)) ||
          (l.userName && l.userName.toLowerCase().includes(query)) ||
          (l.details && l.details.toLowerCase().includes(query)) ||
          (l.entityName && l.entityName.toLowerCase().includes(query))
      );
    }

    return JSON.parse(JSON.stringify(logs)) as AuditLogDocument[];
  } catch (error) {
    console.warn('⚠️ Fallback para mockAuditLogs:', error);
    return JSON.parse(JSON.stringify(mockAuditLogs)) as any;
  }
}

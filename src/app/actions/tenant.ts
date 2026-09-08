'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { TenantDocument } from '@/types/appwrite';
import { mockTenant } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_TENANTS = process.env.APPWRITE_COLLECTION_TENANTS || 'tenants';

export async function fetchTenantProfileAction(): Promise<Partial<TenantDocument>> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return mockTenant;
    }

    const { databases } = await createAdminClient();
    
    // Tenta primeiro listar os documentos da coleção tenants
    try {
      const list = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_TENANTS,
        [Query.limit(1)]
      );
      if (list.documents.length > 0) {
        return JSON.parse(JSON.stringify(list.documents[0]));
      }
    } catch (e) {
      // Ignora e tenta busca direta
    }

    // Tenta obter diretamente com o ID tenant_01
    const document = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_TENANTS,
      'tenant_01'
    );

    return JSON.parse(JSON.stringify(document));
  } catch (error) {
    console.warn('⚠️ Fallback para mockTenant:', error);
    return mockTenant;
  }
}

export async function updateTenantProfileAction(data: Partial<TenantDocument>): Promise<{ success: boolean; data?: Partial<TenantDocument>; error?: string }> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const updated = { ...mockTenant, ...data };
      revalidatePath('/dashboard/profile');
      return { success: true, data: updated };
    }

    const { databases } = await createAdminClient();
    
    // Verifica se já existe algum tenant cadastrado
    let targetId = 'tenant_01';
    try {
      const list = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_TENANTS,
        [Query.limit(1)]
      );
      if (list.documents.length > 0) {
        targetId = list.documents[0].$id;
      }
    } catch (e) {
      // Se não listar, mantém tenant_01
    }

    let document;
    try {
      document = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_TENANTS,
        targetId,
        data
      );
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        document = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_TENANTS,
          targetId,
          {
            personType: data.personType || 'pj',
            name: data.name || 'Minha Empresa',
            companyName: data.companyName || '',
            profession: data.profession || '',
            document: data.document || '00000000000191',
            email: data.email || 'contato@empresa.com',
            phone: data.phone || '',
            plan: data.plan || 'PRO',
            status: data.status || 'active',
            pixKey: data.pixKey || '',
            pixKeyType: data.pixKeyType || 'cnpj',
            asaasCustomerId: data.asaasCustomerId || '',
            taxRegime: data.taxRegime || 'simples_nacional',
            municipalRegistration: data.municipalRegistration || '',
            issRate: data.issRate || 2.0,
          }
        );
      } else {
        throw err;
      }
    }

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/work-orders');
    revalidatePath('/dashboard');
    const plainDocument = JSON.parse(JSON.stringify(document));
    return { success: true, data: plainDocument };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar perfil no Appwrite' };
  }
}

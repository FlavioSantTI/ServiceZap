'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { Query, ID } from 'node-appwrite';
import { ClientDocument, ClientStatus } from '@/types/appwrite';
import { mockClients } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';
import { getCurrentUserAction } from '@/app/actions/auth';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_CLIENTS = process.env.APPWRITE_COLLECTION_CLIENTS || 'clients';

// Sanitizador simples para strings
function sanitizeStr(val?: string, maxLen = 255): string {
  if (!val || typeof val !== 'string') return '';
  return val.trim().substring(0, maxLen);
}

export async function fetchClientsAction(): Promise<Partial<ClientDocument>[]> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return mockClients;
    }

    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_CLIENTS,
      [
        Query.equal('tenantId', tenantId),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ]
    );

    if (response.documents.length === 0) {
      return mockClients;
    }

    return JSON.parse(JSON.stringify(response.documents));
  } catch (error) {
    console.warn('⚠️ Fallback para mockClients:', error);
    return mockClients;
  }
}

export async function createClientAction(data: {
  name: string;
  document: string;
  email: string;
  phone: string;
  status: ClientStatus;
  address?: string;
  addressNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}): Promise<{ success: boolean; data?: Partial<ClientDocument>; error?: string }> {
  try {
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    // Sanitização defensiva
    const cleanData = {
      name: sanitizeStr(data.name, 100),
      document: sanitizeStr(data.document, 30),
      email: sanitizeStr(data.email, 120).toLowerCase(),
      phone: sanitizeStr(data.phone, 30),
      status: (['active', 'inactive', 'lead'].includes(data.status) ? data.status : 'active') as ClientStatus,
      address: sanitizeStr(data.address, 200),
      addressNumber: sanitizeStr(data.addressNumber, 30),
      neighborhood: sanitizeStr(data.neighborhood, 100),
      city: sanitizeStr(data.city, 100),
      state: sanitizeStr(data.state, 10),
      zipCode: sanitizeStr(data.zipCode, 20),
      notes: sanitizeStr(data.notes, 1000),
    };

    if (!cleanData.name || !cleanData.phone) {
      return { success: false, error: 'Nome e telefone são obrigatórios' };
    }

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const mockCreated: Partial<ClientDocument> = {
        $id: `cli_${Math.floor(Math.random() * 900 + 100)}`,
        $createdAt: new Date().toISOString(),
        tenantId,
        totalPaid: 0,
        totalInvoices: 0,
        ...cleanData,
      };
      revalidatePath('/dashboard/clients');
      return { success: true, data: mockCreated };
    }

    const { databases } = await createAdminClient();
    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_CLIENTS,
      ID.unique(),
      {
        tenantId,
        ...cleanData,
        totalPaid: 0,
        totalInvoices: 0,
      }
    );

    revalidatePath('/dashboard/clients');
    const plainDocument = JSON.parse(JSON.stringify(document));
    return { success: true, data: plainDocument };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao cadastrar cliente no Appwrite' };
  }
}

export async function updateClientAction(
  clientId: string,
  data: Partial<{
    name: string;
    document: string;
    email: string;
    phone: string;
    status: ClientStatus;
    address?: string;
    addressNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    notes?: string;
  }>
): Promise<{ success: boolean; data?: Partial<ClientDocument>; error?: string }> {
  try {
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    const cleanData: any = {};
    if (data.name !== undefined) cleanData.name = sanitizeStr(data.name, 100);
    if (data.document !== undefined) cleanData.document = sanitizeStr(data.document, 30);
    if (data.email !== undefined) cleanData.email = sanitizeStr(data.email, 120).toLowerCase();
    if (data.phone !== undefined) cleanData.phone = sanitizeStr(data.phone, 30);
    if (data.status !== undefined) cleanData.status = data.status;
    if (data.address !== undefined) cleanData.address = sanitizeStr(data.address, 200);
    if (data.addressNumber !== undefined) cleanData.addressNumber = sanitizeStr(data.addressNumber, 30);
    if (data.neighborhood !== undefined) cleanData.neighborhood = sanitizeStr(data.neighborhood, 100);
    if (data.city !== undefined) cleanData.city = sanitizeStr(data.city, 100);
    if (data.state !== undefined) cleanData.state = sanitizeStr(data.state, 10);
    if (data.zipCode !== undefined) cleanData.zipCode = sanitizeStr(data.zipCode, 20);
    if (data.notes !== undefined) cleanData.notes = sanitizeStr(data.notes, 1000);

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard/clients');
      return { success: true, data: { $id: clientId, ...cleanData } };
    }

    const { databases } = await createAdminClient();
    let document;
    try {
      // Verifica tenant se existir
      const existing = await databases.getDocument(DATABASE_ID, COLLECTION_CLIENTS, clientId);
      if (existing.tenantId && existing.tenantId !== tenantId && session?.role !== 'super_admin') {
        return { success: false, error: 'Acesso negado a este registro' };
      }

      document = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_CLIENTS,
        clientId,
        cleanData
      );
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        // Se for um item de demonstração (mock) que ainda não existia no banco, criamos no Appwrite
        document = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_CLIENTS,
          ID.unique(),
          {
            tenantId,
            name: cleanData.name || 'Cliente Exemplo',
            document: cleanData.document || '',
            email: cleanData.email || '',
            phone: cleanData.phone || '',
            status: cleanData.status || 'active',
            totalPaid: 0,
            totalInvoices: 0,
            address: cleanData.address || '',
            addressNumber: cleanData.addressNumber || '',
            neighborhood: cleanData.neighborhood || '',
            city: cleanData.city || '',
            state: cleanData.state || '',
            zipCode: cleanData.zipCode || '',
            notes: cleanData.notes || '',
          }
        );
      } else {
        throw err;
      }
    }

    revalidatePath('/dashboard/clients');
    return { success: true, data: JSON.parse(JSON.stringify(document)) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar cliente no Appwrite' };
  }
}

export async function deleteClientAction(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard/clients');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    try {
      const existing = await databases.getDocument(DATABASE_ID, COLLECTION_CLIENTS, clientId);
      if (existing.tenantId && existing.tenantId !== tenantId && session?.role !== 'super_admin') {
        return { success: false, error: 'Acesso negado a este registro' };
      }

      await databases.deleteDocument(DATABASE_ID, COLLECTION_CLIENTS, clientId);
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        revalidatePath('/dashboard/clients');
        return { success: true };
      }
      throw err;
    }

    revalidatePath('/dashboard/clients');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao excluir cliente no Appwrite' };
  }
}

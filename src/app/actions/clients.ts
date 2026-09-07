'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { Query, ID } from 'node-appwrite';
import { ClientDocument, ClientStatus } from '@/types/appwrite';
import { mockClients } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_CLIENTS = process.env.APPWRITE_COLLECTION_CLIENTS || 'clients';

export async function fetchClientsAction(): Promise<Partial<ClientDocument>[]> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return mockClients;
    }

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_CLIENTS,
      [Query.orderDesc('$createdAt'), Query.limit(100)]
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
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const mockCreated: Partial<ClientDocument> = {
        $id: `cli_${Math.floor(Math.random() * 900 + 100)}`,
        $createdAt: new Date().toISOString(),
        tenantId: 'tenant_01',
        totalPaid: 0,
        totalInvoices: 0,
        ...data,
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
        tenantId: 'tenant_01',
        name: data.name,
        document: data.document,
        email: data.email,
        phone: data.phone,
        status: data.status,
        totalPaid: 0,
        totalInvoices: 0,
        address: data.address || '',
        addressNumber: data.addressNumber || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        notes: data.notes || '',
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
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard/clients');
      return { success: true, data: { $id: clientId, ...data } };
    }

    const { databases } = await createAdminClient();
    let document;
    try {
      document = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_CLIENTS,
        clientId,
        data
      );
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        // Se for um item de demonstração (mock) que ainda não existia no banco, criamos no Appwrite
        document = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_CLIENTS,
          ID.unique(),
          {
            tenantId: 'tenant_01',
            name: data.name || 'Cliente Exemplo',
            document: data.document || '',
            email: data.email || '',
            phone: data.phone || '',
            status: data.status || 'active',
            totalPaid: 0,
            totalInvoices: 0,
            address: data.address || '',
            addressNumber: data.addressNumber || '',
            neighborhood: data.neighborhood || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            notes: data.notes || '',
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
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard/clients');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_CLIENTS, clientId);
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        // Se já era um mock e não existia no banco Appwrite, considera excluído com sucesso
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

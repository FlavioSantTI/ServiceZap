'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { Query, ID } from 'node-appwrite';
import { ServiceDocument } from '@/types/appwrite';
import { mockServices } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_SERVICES = process.env.APPWRITE_COLLECTION_SERVICES || 'services';

export async function fetchServicesAction(): Promise<Partial<ServiceDocument>[]> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return mockServices;
    }

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_SERVICES,
      [Query.orderDesc('$createdAt'), Query.limit(100)]
    );

    if (response.documents.length === 0) {
      return mockServices;
    }

    return JSON.parse(JSON.stringify(response.documents));
  } catch (error) {
    console.warn('⚠️ Fallback para mockServices:', error);
    return mockServices;
  }
}

export async function createServiceAction(data: {
  name: string;
  price: number;
  durationMinutes: number;
  category: string;
  description?: string;
}): Promise<{ success: boolean; data?: Partial<ServiceDocument>; error?: string }> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const mockCreated: Partial<ServiceDocument> = {
        $id: `srv_${Math.floor(Math.random() * 900 + 100)}`,
        $createdAt: new Date().toISOString(),
        tenantId: 'tenant_01',
        ...data,
        active: true,
      };
      revalidatePath('/dashboard/services');
      return { success: true, data: mockCreated };
    }

    const { databases } = await createAdminClient();
    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_SERVICES,
      ID.unique(),
      {
        tenantId: 'tenant_01',
        name: data.name,
        price: data.price,
        durationMinutes: data.durationMinutes,
        category: data.category,
        description: data.description || '',
        active: true,
      }
    );

    revalidatePath('/dashboard/services');
    const plainDocument = JSON.parse(JSON.stringify(document));
    return { success: true, data: plainDocument };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao criar serviço no Appwrite' };
  }
}

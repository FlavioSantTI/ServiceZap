'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { Query, ID } from 'node-appwrite';
import { ServiceDocument } from '@/types/appwrite';
import { mockServices } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_SERVICES = process.env.APPWRITE_COLLECTION_SERVICES || 'services';

let inMemoryServices: Partial<ServiceDocument>[] = [...mockServices];

export async function fetchServicesAction(): Promise<Partial<ServiceDocument>[]> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return inMemoryServices;
    }

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_SERVICES,
      [Query.orderDesc('$createdAt'), Query.limit(100)]
    );

    if (response.documents.length === 0) {
      return inMemoryServices;
    }

    return JSON.parse(JSON.stringify(response.documents));
  } catch (error) {
    console.warn('⚠️ Fallback para inMemoryServices:', error);
    return inMemoryServices;
  }
}

export async function createServiceAction(data: {
  name: string;
  price: number;
  durationMinutes: number;
  category: string;
  unit?: string;
  description?: string;
  active?: boolean;
}): Promise<{ success: boolean; data?: Partial<ServiceDocument>; error?: string }> {
  try {
    const newService: Partial<ServiceDocument> = {
      $id: `srv_${Math.floor(Math.random() * 9000 + 1000)}`,
      $createdAt: new Date().toISOString(),
      tenantId: 'tenant_01',
      name: data.name,
      price: data.price,
      durationMinutes: data.durationMinutes,
      category: data.category,
      unit: data.unit || 'un',
      description: data.description || '',
      active: data.active !== undefined ? data.active : true,
    };

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      inMemoryServices.unshift(newService);
      revalidatePath('/dashboard/services');
      return { success: true, data: newService };
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
        unit: data.unit || 'un',
        description: data.description || '',
        active: data.active !== undefined ? data.active : true,
      }
    );

    const plainDocument = JSON.parse(JSON.stringify(document));
    inMemoryServices.unshift(plainDocument);
    revalidatePath('/dashboard/services');
    return { success: true, data: plainDocument };
  } catch (err: any) {
    console.error('Erro ao criar serviço no Appwrite:', err);
    // Fallback gracioso para inMemory
    const fallbackService: Partial<ServiceDocument> = {
      $id: `srv_${Math.floor(Math.random() * 9000 + 1000)}`,
      $createdAt: new Date().toISOString(),
      tenantId: 'tenant_01',
      name: data.name,
      price: data.price,
      durationMinutes: data.durationMinutes,
      category: data.category,
      unit: data.unit || 'un',
      description: data.description || '',
      active: data.active !== undefined ? data.active : true,
    };
    inMemoryServices.unshift(fallbackService);
    revalidatePath('/dashboard/services');
    return { success: true, data: fallbackService };
  }
}

export async function updateServiceAction(
  serviceId: string,
  data: Partial<{
    name: string;
    price: number;
    durationMinutes: number;
    category: string;
    unit: string;
    description: string;
    active: boolean;
  }>
): Promise<{ success: boolean; data?: Partial<ServiceDocument>; error?: string }> {
  try {
    // Atualiza em memória
    inMemoryServices = inMemoryServices.map((s) =>
      s.$id === serviceId ? { ...s, ...data } : s
    );

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard/services');
      const updated = inMemoryServices.find((s) => s.$id === serviceId);
      return { success: true, data: updated };
    }

    const { databases } = await createAdminClient();
    let document;
    try {
      document = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_SERVICES,
        serviceId,
        data
      );
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        // Se não existia no banco Appwrite, cria
        document = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_SERVICES,
          ID.unique(),
          {
            tenantId: 'tenant_01',
            name: data.name || 'Serviço',
            price: data.price || 0,
            durationMinutes: data.durationMinutes || 30,
            category: data.category || 'Geral',
            unit: data.unit || 'un',
            description: data.description || '',
            active: data.active !== undefined ? data.active : true,
          }
        );
      } else {
        throw err;
      }
    }

    revalidatePath('/dashboard/services');
    return { success: true, data: JSON.parse(JSON.stringify(document)) };
  } catch (err: any) {
    console.warn('⚠️ Fallback ao atualizar serviço:', err);
    revalidatePath('/dashboard/services');
    const updated = inMemoryServices.find((s) => s.$id === serviceId);
    return { success: true, data: updated };
  }
}

export async function deleteServiceAction(
  serviceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    inMemoryServices = inMemoryServices.filter((s) => s.$id !== serviceId);

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard/services');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_SERVICES, serviceId);
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        revalidatePath('/dashboard/services');
        return { success: true };
      }
      throw err;
    }

    revalidatePath('/dashboard/services');
    return { success: true };
  } catch (err: any) {
    console.warn('⚠️ Fallback ao excluir serviço:', err);
    revalidatePath('/dashboard/services');
    return { success: true };
  }
}

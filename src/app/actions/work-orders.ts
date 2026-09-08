'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { Query, ID } from 'node-appwrite';
import { WorkOrderDocument, WorkOrderStatus, WorkOrderType, WorkOrderItem } from '@/types/appwrite';
import { mockWorkOrders } from '@/lib/mock-data';
import { createInvoiceAction } from './invoices';
import { revalidatePath } from 'next/cache';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_WORK_ORDERS = process.env.APPWRITE_COLLECTION_WORK_ORDERS || 'work_orders';

export async function fetchWorkOrdersAction(): Promise<Partial<WorkOrderDocument>[]> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return mockWorkOrders;
    }

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_WORK_ORDERS,
      [Query.orderDesc('$createdAt'), Query.limit(100)]
    );

    if (response.documents.length === 0) {
      return mockWorkOrders;
    }

    return JSON.parse(JSON.stringify(response.documents));
  } catch (error) {
    console.warn('⚠️ Fallback para mockWorkOrders:', error);
    return mockWorkOrders;
  }
}

export async function createWorkOrderAction(data: {
  type: WorkOrderType;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  serviceId?: string;
  serviceName: string;
  items?: WorkOrderItem[];
  itemsJson?: string;
  amount: number;
  discount?: number;
  dueDate?: string;
  executionDate?: string;
  notes?: string;
}): Promise<{ success: boolean; data?: Partial<WorkOrderDocument>; error?: string }> {
  try {
    const prefix = data.type === 'quote' ? 'ORC' : 'OS';
    const number = `${prefix}-2026-${Math.floor(Math.random() * 900 + 100)}`;
    const itemsJsonString = data.itemsJson || (data.items ? JSON.stringify(data.items) : '');

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const mockCreated: Partial<WorkOrderDocument> = {
        $id: `wo_${Math.floor(Math.random() * 900 + 100)}`,
        $createdAt: new Date().toISOString(),
        tenantId: 'tenant_01',
        type: data.type,
        number,
        clientId: data.clientId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        itemsJson: itemsJsonString,
        amount: data.amount,
        discount: data.discount || 0,
        status: data.type === 'quote' ? 'quote_sent' : 'approved',
        dueDate: data.dueDate,
        executionDate: data.executionDate,
        notes: data.notes,
      };

      revalidatePath('/dashboard');
      revalidatePath('/dashboard/work-orders');
      return { success: true, data: mockCreated };
    }

    const { databases } = await createAdminClient();
    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_WORK_ORDERS,
      ID.unique(),
      {
        tenantId: 'tenant_01',
        type: data.type,
        number,
        clientId: data.clientId,
        clientName: data.clientName,
        clientPhone: data.clientPhone || '',
        clientEmail: data.clientEmail || '',
        serviceId: data.serviceId || '',
        serviceName: data.serviceName,
        itemsJson: itemsJsonString,
        amount: data.amount,
        discount: data.discount || 0,
        status: data.type === 'quote' ? 'quote_sent' : 'approved',
        dueDate: data.dueDate || '',
        executionDate: data.executionDate || '',
        notes: data.notes || '',
      }
    );

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/work-orders');
    return { success: true, data: JSON.parse(JSON.stringify(document)) };
  } catch (err: any) {
    console.error('Erro ao criar Ordem de Serviço no Appwrite:', err);
    return { success: false, error: err.message || 'Erro ao criar Ordem de Serviço no Appwrite' };
  }
}

export async function updateWorkOrderAction(
  id: string,
  data: Partial<{
    type: WorkOrderType;
    clientId: string;
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    serviceId?: string;
    serviceName: string;
    items?: WorkOrderItem[];
    itemsJson?: string;
    amount: number;
    discount?: number;
    status?: WorkOrderStatus;
    dueDate?: string;
    executionDate?: string;
    invoiceId?: string;
    notes?: string;
  }>
): Promise<{ success: boolean; data?: Partial<WorkOrderDocument>; error?: string }> {
  try {
    const itemsJsonString = data.itemsJson || (data.items ? JSON.stringify(data.items) : undefined);

    const updatePayload: any = { ...data };
    if (itemsJsonString !== undefined) {
      updatePayload.itemsJson = itemsJsonString;
    }
    delete updatePayload.items;

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/work-orders');
      return { success: true, data: { $id: id, ...updatePayload } };
    }

    const { databases } = await createAdminClient();
    let document;
    try {
      document = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_WORK_ORDERS,
        id,
        updatePayload
      );
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/work-orders');
        return { success: true, data: { $id: id, ...updatePayload } };
      }
      throw err;
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/work-orders');
    return { success: true, data: JSON.parse(JSON.stringify(document)) };
  } catch (err: any) {
    console.error('Erro ao atualizar Ordem de Serviço no Appwrite:', err);
    return { success: false, error: err.message || 'Erro ao atualizar Ordem de Serviço no Appwrite' };
  }
}

export async function updateWorkOrderStatusAction(
  id: string,
  status: WorkOrderStatus,
  type?: WorkOrderType
): Promise<{ success: boolean; data?: Partial<WorkOrderDocument>; error?: string }> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/work-orders');
      return { success: true, data: { $id: id, status, ...(type ? { type } : {}) } };
    }

    const { databases } = await createAdminClient();
    const payload: any = { status };
    if (type) payload.type = type;

    let document;
    try {
      document = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_WORK_ORDERS,
        id,
        payload
      );
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/work-orders');
        return { success: true, data: { $id: id, status } };
      }
      throw err;
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/work-orders');
    return { success: true, data: JSON.parse(JSON.stringify(document)) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar status da O.S. no Appwrite' };
  }
}

export async function convertWorkOrderToInvoiceAction(
  workOrderId: string,
  workOrderData: {
    clientName: string;
    amount: number;
    serviceName: string;
  }
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const invoiceRes = await createInvoiceAction({
      clientName: workOrderData.clientName,
      amount: workOrderData.amount,
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      description: `Fatura referente à O.S.: ${workOrderData.serviceName}`,
      issueNfe: false,
    });

    if (!invoiceRes.success || !invoiceRes.data?.$id) {
      return { success: false, error: invoiceRes.error || 'Falha ao criar cobrança' };
    }

    const invoiceId = invoiceRes.data.$id;
    await updateWorkOrderAction(workOrderId, {
      status: 'billed',
      invoiceId,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/work-orders');
    revalidatePath('/dashboard/invoices');

    return { success: true, invoiceId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao converter O.S. em Cobrança' };
  }
}

export async function deleteWorkOrderAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/work-orders');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_WORK_ORDERS, id);
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/work-orders');
        return { success: true };
      }
      throw err;
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/work-orders');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao excluir Ordem de Serviço no Appwrite' };
  }
}

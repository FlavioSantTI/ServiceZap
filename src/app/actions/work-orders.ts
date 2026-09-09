'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { Query, ID } from 'node-appwrite';
import { WorkOrderDocument, WorkOrderStatus, WorkOrderType, WorkOrderItem } from '@/types/appwrite';
import { mockWorkOrders } from '@/lib/mock-data';
import { createInvoiceAction } from './invoices';
import { revalidatePath } from 'next/cache';
import { getCurrentUserAction } from '@/app/actions/auth';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_WORK_ORDERS = process.env.APPWRITE_COLLECTION_WORK_ORDERS || 'work_orders';

function sanitizeStr(val?: string, maxLen = 255): string {
  if (!val || typeof val !== 'string') return '';
  return val.trim().substring(0, maxLen);
}

export async function fetchWorkOrdersAction(): Promise<Partial<WorkOrderDocument>[]> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return mockWorkOrders;
    }

    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_WORK_ORDERS,
      [
        Query.equal('tenantId', tenantId),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ]
    );

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
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    const prefix = data.type === 'quote' ? 'ORC' : 'OS';
    const number = `${prefix}-2026-${Math.floor(Math.random() * 900 + 100)}`;
    const itemsJsonString = data.itemsJson || (data.items ? JSON.stringify(data.items) : '');

    const cleanData = {
      type: data.type,
      clientId: sanitizeStr(data.clientId, 50),
      clientName: sanitizeStr(data.clientName, 100),
      clientPhone: sanitizeStr(data.clientPhone, 30),
      clientEmail: sanitizeStr(data.clientEmail, 120),
      serviceId: sanitizeStr(data.serviceId, 50),
      serviceName: sanitizeStr(data.serviceName, 150),
      itemsJson: itemsJsonString,
      amount: Math.max(0, Number(data.amount) || 0),
      discount: Math.max(0, Number(data.discount) || 0),
      dueDate: sanitizeStr(data.dueDate, 30),
      executionDate: sanitizeStr(data.executionDate, 30),
      notes: sanitizeStr(data.notes, 2000),
    };

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const mockCreated: Partial<WorkOrderDocument> = {
        $id: `wo_${Math.floor(Math.random() * 900 + 100)}`,
        $createdAt: new Date().toISOString(),
        tenantId,
        number,
        status: cleanData.type === 'quote' ? 'quote_sent' : 'approved',
        ...cleanData,
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
        tenantId,
        number,
        status: cleanData.type === 'quote' ? 'quote_sent' : 'approved',
        ...cleanData,
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
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    const itemsJsonString = data.itemsJson || (data.items ? JSON.stringify(data.items) : undefined);

    const updatePayload: any = { ...data };
    if (itemsJsonString !== undefined) {
      updatePayload.itemsJson = itemsJsonString;
    }
    delete updatePayload.items;

    if (data.clientName !== undefined) updatePayload.clientName = sanitizeStr(data.clientName, 100);
    if (data.serviceName !== undefined) updatePayload.serviceName = sanitizeStr(data.serviceName, 150);
    if (data.notes !== undefined) updatePayload.notes = sanitizeStr(data.notes, 2000);
    if (data.amount !== undefined) updatePayload.amount = Math.max(0, Number(data.amount) || 0);
    if (data.discount !== undefined) updatePayload.discount = Math.max(0, Number(data.discount) || 0);

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/work-orders');
      return { success: true, data: { $id: id, ...updatePayload } };
    }

    const { databases } = await createAdminClient();
    let document;
    try {
      const existing = await databases.getDocument(DATABASE_ID, COLLECTION_WORK_ORDERS, id);
      if (existing.tenantId && existing.tenantId !== tenantId && session?.role !== 'super_admin') {
        return { success: false, error: 'Acesso negado a esta Ordem de Serviço' };
      }

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
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

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
      const existing = await databases.getDocument(DATABASE_ID, COLLECTION_WORK_ORDERS, id);
      if (existing.tenantId && existing.tenantId !== tenantId && session?.role !== 'super_admin') {
        return { success: false, error: 'Acesso negado a esta Ordem de Serviço' };
      }

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
    let clientId: string | undefined;
    let clientPhone: string | undefined;

    if (process.env.APPWRITE_API_KEY) {
      try {
        const { databases } = await createAdminClient();
        const woDoc = await databases.getDocument<WorkOrderDocument>(DATABASE_ID, COLLECTION_WORK_ORDERS, workOrderId);
        if (woDoc) {
          clientId = woDoc.clientId;
          clientPhone = woDoc.clientPhone;
        }
      } catch (e) {
        console.warn('Não foi possível obter dados completos da O.S. para conversão:', e);
      }
    }

    const invoiceRes = await createInvoiceAction({
      clientName: sanitizeStr(workOrderData.clientName, 100),
      clientId,
      clientPhone,
      amount: Math.max(0, Number(workOrderData.amount) || 0),
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      description: `Fatura referente à O.S.: ${sanitizeStr(workOrderData.serviceName, 150)}`,
      issueNfe: false,
      sendWhatsApp: !!clientPhone,
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
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/work-orders');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    try {
      const existing = await databases.getDocument(DATABASE_ID, COLLECTION_WORK_ORDERS, id);
      if (existing.tenantId && existing.tenantId !== tenantId && session?.role !== 'super_admin') {
        return { success: false, error: 'Acesso negado a esta Ordem de Serviço' };
      }

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

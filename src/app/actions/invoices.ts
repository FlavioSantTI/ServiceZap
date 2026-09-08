'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { Query, ID } from 'node-appwrite';
import { InvoiceDocument, InvoiceStatus, NfeStatus } from '@/types/appwrite';
import { mockInvoices } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';
import { getCurrentUserAction } from '@/app/actions/auth';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_INVOICES = process.env.APPWRITE_COLLECTION_INVOICES || 'invoices';

function sanitizeStr(val?: string, maxLen = 255): string {
  if (!val || typeof val !== 'string') return '';
  return val.trim().substring(0, maxLen);
}

export async function fetchInvoicesAction(): Promise<Partial<InvoiceDocument>[]> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return mockInvoices;
    }

    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_INVOICES,
      [
        Query.equal('tenantId', tenantId),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ]
    );

    if (response.documents.length === 0) {
      return mockInvoices;
    }

    return JSON.parse(JSON.stringify(response.documents));
  } catch (error) {
    console.warn('⚠️ Fallback para mockInvoices:', error);
    return mockInvoices;
  }
}

export async function createInvoiceAction(data: {
  clientName: string;
  amount: number;
  dueDate: string;
  description?: string;
  issueNfe?: boolean;
}): Promise<{ success: boolean; data?: Partial<InvoiceDocument>; error?: string }> {
  try {
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    const cleanAmount = Math.max(0, Number(data.amount) || 0);
    const cleanClientName = sanitizeStr(data.clientName, 100);
    const cleanDueDate = sanitizeStr(data.dueDate, 30);
    const cleanDesc = sanitizeStr(data.description, 1000) || 'Cobrança Gerada no ServiceZap';

    const pixCopyPaste = '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405' +
      cleanAmount.toFixed(2) + '5802BR5913ServiceZap6008SAO PAULO62070503***6304E8A2';
    const pixQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCopyPaste)}`;

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const mockCreated: Partial<InvoiceDocument> = {
        $id: `inv_${Math.floor(Math.random() * 900 + 100)}`,
        $createdAt: new Date().toISOString(),
        tenantId,
        clientId: 'cli_01',
        clientName: cleanClientName,
        amount: cleanAmount,
        dueDate: cleanDueDate,
        status: 'pending' as InvoiceStatus,
        description: cleanDesc,
        nfeStatus: (data.issueNfe ? 'processing' : 'none') as NfeStatus,
        pixQrCodeUrl,
        pixCopyPaste,
      };

      revalidatePath('/dashboard');
      revalidatePath('/dashboard/invoices');
      return { success: true, data: mockCreated };
    }

    const { databases } = await createAdminClient();
    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_INVOICES,
      ID.unique(),
      {
        tenantId,
        clientId: 'cli_01',
        clientName: cleanClientName,
        amount: cleanAmount,
        dueDate: cleanDueDate,
        status: 'pending',
        description: cleanDesc,
        nfeStatus: data.issueNfe ? 'processing' : 'none',
        pixQrCodeUrl,
        pixCopyPaste,
      }
    );

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/invoices');
    const plainDocument = JSON.parse(JSON.stringify(document));
    return { success: true, data: plainDocument };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao gerar fatura no Appwrite' };
  }
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  status: InvoiceStatus,
  nfeStatus?: NfeStatus
): Promise<{ success: boolean; data?: Partial<InvoiceDocument>; error?: string }> {
  try {
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/invoices');
      return { success: true, data: { $id: invoiceId, status, nfeStatus } };
    }

    const { databases } = await createAdminClient();
    const payload: any = { status };
    if (nfeStatus) payload.nfeStatus = nfeStatus;

    let document;
    try {
      const existing = await databases.getDocument(DATABASE_ID, COLLECTION_INVOICES, invoiceId);
      if (existing.tenantId && existing.tenantId !== tenantId && session?.role !== 'super_admin') {
        return { success: false, error: 'Acesso negado a esta fatura' };
      }

      document = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_INVOICES,
        invoiceId,
        payload
      );
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/invoices');
        return { success: true, data: { $id: invoiceId, status, nfeStatus } };
      }
      throw err;
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/invoices');
    return { success: true, data: JSON.parse(JSON.stringify(document)) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar fatura no Appwrite' };
  }
}

export async function deleteInvoiceAction(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/invoices');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    try {
      const existing = await databases.getDocument(DATABASE_ID, COLLECTION_INVOICES, invoiceId);
      if (existing.tenantId && existing.tenantId !== tenantId && session?.role !== 'super_admin') {
        return { success: false, error: 'Acesso negado a esta fatura' };
      }

      await databases.deleteDocument(DATABASE_ID, COLLECTION_INVOICES, invoiceId);
    } catch (err: any) {
      if (err.code === 404 || err.type === 'document_not_found') {
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/invoices');
        return { success: true };
      }
      throw err;
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/invoices');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao excluir fatura no Appwrite' };
  }
}

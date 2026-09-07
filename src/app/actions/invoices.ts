'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { Query, ID } from 'node-appwrite';
import { InvoiceDocument, InvoiceStatus, NfeStatus } from '@/types/appwrite';
import { mockInvoices } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_INVOICES = process.env.APPWRITE_COLLECTION_INVOICES || 'invoices';

export async function fetchInvoicesAction(): Promise<Partial<InvoiceDocument>[]> {
  try {
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return mockInvoices;
    }

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_INVOICES,
      [Query.orderDesc('$createdAt'), Query.limit(100)]
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
    const pixCopyPaste = '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405' +
      data.amount.toFixed(2) + '5802BR5913ServiceZap6008SAO PAULO62070503***6304E8A2';
    const pixQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCopyPaste)}`;

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const mockCreated: Partial<InvoiceDocument> = {
        $id: `inv_${Math.floor(Math.random() * 900 + 100)}`,
        $createdAt: new Date().toISOString(),
        tenantId: 'tenant_01',
        clientId: 'cli_01',
        clientName: data.clientName,
        amount: data.amount,
        dueDate: data.dueDate,
        status: 'pending' as InvoiceStatus,
        description: data.description || 'Cobrança Gerada no ServiceZap',
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
        tenantId: 'tenant_01',
        clientId: 'cli_01',
        clientName: data.clientName,
        amount: data.amount,
        dueDate: data.dueDate,
        status: 'pending',
        description: data.description || 'Cobrança Gerada no ServiceZap',
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
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/invoices');
      return { success: true };
    }

    const { databases } = await createAdminClient();
    try {
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

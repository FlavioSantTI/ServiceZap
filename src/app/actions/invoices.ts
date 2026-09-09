'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { Query, ID } from 'node-appwrite';
import { InvoiceDocument, InvoiceStatus, NfeStatus, ClientDocument } from '@/types/appwrite';
import { mockInvoices } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';
import { getCurrentUserAction } from '@/app/actions/auth';
import { sendWhatsAppMessageDirectAction } from '@/app/actions/whatsapp';
import { fetchTenantProfileAction } from '@/app/actions/tenant';
import { sanitizeWhatsAppJid } from '@/lib/utils/whatsappUtils';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_INVOICES = process.env.APPWRITE_COLLECTION_INVOICES || 'invoices';
const COLLECTION_CLIENTS = process.env.APPWRITE_COLLECTION_CLIENTS || 'clients';

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

    return JSON.parse(JSON.stringify(response.documents));
  } catch (error) {
    console.warn('⚠️ Fallback para mockInvoices:', error);
    return mockInvoices;
  }
}

export async function sendInvoiceViaWhatsAppAction(
  invoiceId: string,
  targetPhone?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    let invoice: Partial<InvoiceDocument> | null = null;
    let recipientPhone = targetPhone ? sanitizeWhatsAppJid(targetPhone) : '';

    if (process.env.APPWRITE_API_KEY) {
      const { databases } = await createAdminClient();
      try {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTION_INVOICES, invoiceId);
        invoice = JSON.parse(JSON.stringify(doc));
      } catch (e) {
        console.warn('Fatura não encontrada no banco, buscando mock:', e);
      }
    }

    if (!invoice) {
      const foundMock = mockInvoices.find((inv) => inv.$id === invoiceId);
      if (foundMock) invoice = foundMock;
    }

    if (!invoice) {
      return { success: false, error: 'Fatura não encontrada.' };
    }

    // Se o telefone não foi passado, tenta localizar o telefone do cliente no Appwrite
    if (!recipientPhone && invoice.clientId) {
      try {
        const { databases } = await createAdminClient();
        const clientDoc = await databases.getDocument(DATABASE_ID, COLLECTION_CLIENTS, invoice.clientId);
        if (clientDoc && clientDoc.phone) {
          recipientPhone = sanitizeWhatsAppJid(clientDoc.phone);
        }
      } catch {
        // busca alternativa por nome
      }
    }

    if (!recipientPhone && invoice.clientName) {
      try {
        const { databases } = await createAdminClient();
        const clientQuery = await databases.listDocuments(DATABASE_ID, COLLECTION_CLIENTS, [
          Query.equal('tenantId', tenantId),
          Query.equal('name', invoice.clientName),
          Query.limit(1),
        ]);
        if (clientQuery.documents.length > 0 && clientQuery.documents[0].phone) {
          recipientPhone = sanitizeWhatsAppJid(clientQuery.documents[0].phone);
        }
      } catch {
        // segue com erro se não encontrar
      }
    }

    if (!recipientPhone) {
      return {
        success: false,
        error: 'Número de WhatsApp do cliente não encontrado. Por favor, forneça o número de telefone.',
      };
    }

    const tenantProfile = await fetchTenantProfileAction();
    const companyName = tenantProfile?.name || tenantProfile?.companyName || 'ServiceZap';
    const formattedAmount = (invoice.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const formattedDueDate = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('pt-BR')
      : 'A combinar';

    const messageText =
      `🧾 *COBRANÇA DE SERVIÇO - ${companyName}*\n\n` +
      `Olá, *${invoice.clientName || 'Cliente'}*!\n` +
      `Sua fatura foi emitida no valor de *R$ ${formattedAmount}* referente a:\n` +
      `📋 *${invoice.description || 'Prestação de Serviços'}*\n` +
      `📅 *Vencimento:* ${formattedDueDate}\n\n` +
      `💠 *PAGAMENTO VIA PIX (Copia e Cola):*\n` +
      `\`${invoice.pixCopyPaste || 'Chave PIX indisponível'}\`\n\n` +
      `💡 *Como pagar:* Copie o código acima, abra o app do seu banco e escolha a opção *PIX Copia e Cola*.\n\n` +
      `Assim que o pagamento for confirmado, seu comprovante será gerado automaticamente. Obrigado!`;

    const sendRes = await sendWhatsAppMessageDirectAction(recipientPhone, messageText);
    if (!sendRes.success) {
      return { success: false, error: sendRes.error || 'Falha ao enviar fatura via WhatsApp.' };
    }

    return { success: true, message: `Fatura enviada com sucesso para ${recipientPhone}!` };
  } catch (err: any) {
    console.error('Erro em sendInvoiceViaWhatsAppAction:', err);
    return { success: false, error: err.message || 'Erro ao processar envio pelo WhatsApp.' };
  }
}

export async function createInvoiceAction(data: {
  clientName: string;
  clientId?: string;
  clientPhone?: string;
  amount: number;
  dueDate: string;
  description?: string;
  issueNfe?: boolean;
  sendWhatsApp?: boolean;
}): Promise<{ success: boolean; data?: Partial<InvoiceDocument>; error?: string }> {
  try {
    const session = await getCurrentUserAction();
    const tenantId = session?.tenantId || 'tenant_01';

    const cleanAmount = Math.max(0, Number(data.amount) || 0);
    const cleanClientName = sanitizeStr(data.clientName, 100);
    const cleanDueDate = sanitizeStr(data.dueDate, 30);
    const cleanDesc = sanitizeStr(data.description, 1000) || 'Cobrança Gerada no ServiceZap';
    const cleanPhone = data.clientPhone ? sanitizeWhatsAppJid(data.clientPhone) : '';
    let finalClientId = data.clientId || '';

    const pixCopyPaste = '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405' +
      cleanAmount.toFixed(2) + '5802BR5913ServiceZap6008SAO PAULO62070503***6304E8A2';
    const pixQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCopyPaste)}`;

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const mockCreated: Partial<InvoiceDocument> = {
        $id: `inv_${Math.floor(Math.random() * 900 + 100)}`,
        $createdAt: new Date().toISOString(),
        tenantId,
        clientId: finalClientId || 'cli_01',
        clientName: cleanClientName,
        amount: cleanAmount,
        dueDate: cleanDueDate,
        status: 'pending' as InvoiceStatus,
        description: cleanDesc,
        nfeStatus: (data.issueNfe ? 'processing' : 'none') as NfeStatus,
        pixQrCodeUrl,
        pixCopyPaste,
      };

      if (data.sendWhatsApp && cleanPhone) {
        await sendInvoiceViaWhatsAppAction(mockCreated.$id!, cleanPhone);
      }

      revalidatePath('/dashboard');
      revalidatePath('/dashboard/invoices');
      return { success: true, data: mockCreated };
    }

    const { databases } = await createAdminClient();

    // Se o clientId não foi fornecido, tenta localizar ou criar cliente correspondente
    if (!finalClientId && cleanClientName) {
      try {
        const clientQuery = await databases.listDocuments(DATABASE_ID, COLLECTION_CLIENTS, [
          Query.equal('tenantId', tenantId),
          Query.equal('name', cleanClientName),
          Query.limit(1),
        ]);
        if (clientQuery.documents.length > 0) {
          finalClientId = clientQuery.documents[0].$id;
        } else if (cleanPhone) {
          const newCli = await databases.createDocument(DATABASE_ID, COLLECTION_CLIENTS, ID.unique(), {
            tenantId,
            name: cleanClientName,
            document: '',
            email: '',
            phone: cleanPhone,
            status: 'active',
          });
          finalClientId = newCli.$id;
        }
      } catch (err) {
        console.warn('Erro ao verificar cliente para fatura:', err);
      }
    }

    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_INVOICES,
      ID.unique(),
      {
        tenantId,
        clientId: finalClientId || 'cli_01',
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

    const plainDocument = JSON.parse(JSON.stringify(document));

    // Dispara envio automático no WhatsApp se solicitado
    if (data.sendWhatsApp && cleanPhone) {
      await sendInvoiceViaWhatsAppAction(plainDocument.$id, cleanPhone);
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/invoices');
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

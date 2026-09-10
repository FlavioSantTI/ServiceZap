'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { LeadData } from '@/types/campaign';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_LEADS = process.env.APPWRITE_COLLECTION_LEADS || 'leads_servicezap';

// Mock in-memory/fallback leads store for resilience
let memoryLeads: LeadData[] = [];

export async function submitCampaignLeadAction(input: {
  name: string;
  whatsapp: string;
  service_type: string;
  daily_volume?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  leadId: string;
  savedToAppwrite: boolean;
  message: string;
}> {
  const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanPhone = input.whatsapp.replace(/\D/g, '');

  const newLead: LeadData = {
    $id: leadId,
    name: input.name.trim(),
    whatsapp: cleanPhone,
    service_type: input.service_type.trim(),
    daily_volume: input.daily_volume || '50 a 200 mensagens/dia',
    status: 'pendente_avaliacao',
    created_at: new Date().toISOString(),
    notes: input.notes || 'Enviado pela Landing Page do Programa Piloto Beta (5 Vagas)',
  };

  // Always keep in memory fallback
  memoryLeads = [newLead, ...memoryLeads];

  try {
    if (process.env.APPWRITE_API_KEY && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const { databases } = await createAdminClient();

      try {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_LEADS,
          ID.unique(),
          {
            name: newLead.name,
            whatsapp: newLead.whatsapp,
            service_type: newLead.service_type,
            daily_volume: newLead.daily_volume,
            status: newLead.status,
            created_at: newLead.created_at,
            notes: newLead.notes,
          }
        );

        revalidatePath('/dashboard/super-admin');
        return {
          success: true,
          leadId,
          savedToAppwrite: true,
          message: 'Candidatura registrada com sucesso no Appwrite!',
        };
      } catch (dbErr: any) {
        // If collection doesn't exist yet, log warning and return success using memory store
        console.warn('⚠️ Erro ao salvar lead no Appwrite (Coleção pode não existir ainda):', dbErr?.message || dbErr);
      }
    }
  } catch (err) {
    console.warn('⚠️ Fallback de candidatura salvo em memória:', err);
  }

  return {
    success: true,
    leadId,
    savedToAppwrite: false,
    message: 'Candidatura registrada para avaliação!',
  };
}

export async function getCampaignLeadsAction(): Promise<LeadData[]> {
  try {
    if (process.env.APPWRITE_API_KEY && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const { databases } = await createAdminClient();
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_LEADS,
          [Query.orderDesc('$createdAt'), Query.limit(100)]
        );

        if (response.documents.length > 0) {
          return response.documents.map((doc: any) => ({
            $id: doc.$id,
            name: doc.name || 'Sem nome',
            whatsapp: doc.whatsapp || '',
            service_type: doc.service_type || 'Geral',
            daily_volume: doc.daily_volume || doc.dailyVolume || '50 a 200/dia',
            status: doc.status || 'pendente_avaliacao',
            created_at: doc.created_at || doc.$createdAt,
            notes: doc.notes || '',
          }));
        }
      } catch (dbErr) {
        console.warn('⚠️ Coleção leads_servicezap não encontrada no Appwrite, usando fallback.');
      }
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar leads do Appwrite:', error);
  }

  return memoryLeads;
}

export async function updateLeadStatusAction(
  leadId: string,
  status: LeadData['status']
): Promise<{ success: boolean }> {
  try {
    const memoryItem = memoryLeads.find((l) => l.$id === leadId);
    if (memoryItem) {
      memoryItem.status = status;
    }

    if (process.env.APPWRITE_API_KEY && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      const { databases } = await createAdminClient();
      try {
        await databases.updateDocument(DATABASE_ID, COLLECTION_LEADS, leadId, { status });
      } catch (err) {
        console.warn('⚠️ Não foi possível atualizar lead no Appwrite:', err);
      }
    }

    revalidatePath('/dashboard/super-admin');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

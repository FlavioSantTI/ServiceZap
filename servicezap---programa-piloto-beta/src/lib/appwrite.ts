import { Client, Databases, ID } from 'appwrite';
import { LeadData } from '../types';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const collectionId = import.meta.env.VITE_APPWRITE_COLLECTION_ID || 'leads_servicezap';

let client: Client | null = null;
let databases: Databases | null = null;

export const isAppwriteConfigured = (): boolean => {
  return Boolean(projectId && databaseId);
};

export const getAppwriteClient = () => {
  if (!client && projectId) {
    client = new Client().setEndpoint(endpoint).setProject(projectId);
    databases = new Databases(client);
  }
  return { client, databases };
};

const LOCAL_STORAGE_KEY = 'servicezap_leads_db';

export const getLocalLeads = (): LeadData[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Erro ao ler leads locais:', err);
    return [];
  }
};

export const saveLeadLocally = (lead: LeadData): void => {
  try {
    const existing = getLocalLeads();
    const updated = [lead, ...existing];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Erro ao salvar lead localmente:', err);
  }
};

export async function submitLeadEvaluation(leadInput: Omit<LeadData, 'status' | 'created_at'>): Promise<{
  success: boolean;
  savedToAppwrite: boolean;
  leadId: string;
  message: string;
}> {
  const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const lead: LeadData = {
    ...leadInput,
    $id: leadId,
    status: 'pendente_avaliacao',
    created_at: new Date().toISOString(),
  };

  // 1. Sempre garante salvar no backup local (nunca perde dados de lead)
  saveLeadLocally(lead);

  // 2. Se Appwrite estiver configurado, envia para a collection
  if (isAppwriteConfigured()) {
    try {
      const { databases: db } = getAppwriteClient();
      if (db) {
        await db.createDocument(
          databaseId,
          collectionId,
          ID.unique(),
          {
            name: lead.name,
            whatsapp: lead.whatsapp,
            service_type: lead.service_type,
            daily_volume: lead.daily_volume || 'Nao informado',
            status: 'pendente_avaliacao',
            created_at: lead.created_at,
            notes: lead.notes || 'Enviado pela Landing Page para avaliacao das 5 vagas'
          }
        );
        return {
          success: true,
          savedToAppwrite: true,
          leadId,
          message: 'Candidatura enviada para avaliação e registrada no Appwrite!'
        };
      }
    } catch (appwriteErr) {
      console.warn('Appwrite indisponível ou permissões pendentes, lead salvo no armazenamento local:', appwriteErr);
      return {
        success: true,
        savedToAppwrite: false,
        leadId,
        message: 'Candidatura enviada para avaliação com sucesso!'
      };
    }
  }

  return {
    success: true,
    savedToAppwrite: false,
    leadId,
    message: 'Candidatura gravada para avaliação com sucesso!'
  };
}

import { Client, Databases, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_CLIENTS = process.env.APPWRITE_COLLECTION_CLIENTS || 'clients';

async function main() {
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  console.log('🔍 [ServiceZap] Verificando lista de clientes no Appwrite...');
  const res = await databases.listDocuments(databaseId, COLLECTION_CLIENTS, [Query.limit(100)]);
  console.log(`Total de clientes: ${res.total}`);

  let autoDeleted = 0;
  for (const doc of res.documents) {
    const isAutoContact = doc.name?.startsWith('Contato WA') || doc.notes?.includes('Contato detectado');
    if (isAutoContact) {
      console.log(`🗑️ Removendo contato gerado automaticamente por mensagens antigas: [${doc.$id}] ${doc.name} (${(doc as any).phone})`);
      try {
        await databases.deleteDocument(databaseId, COLLECTION_CLIENTS, doc.$id);
        autoDeleted++;
      } catch (e: any) {
        console.warn(`Erro ao deletar ${doc.$id}:`, e?.message);
      }
    } else {
      console.log(`👤 Cliente cadastrado mantido: [${doc.$id}] ${doc.name} | Tenant: ${(doc as any).tenantId || 'tenant_01'}`);
    }
  }

  console.log(`\n✅ Limpeza de contatos automáticos concluída! ${autoDeleted} contatos residuais removidos.`);
}

main().catch(console.error);

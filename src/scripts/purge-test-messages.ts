import { Client, Databases, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_MESSAGES = process.env.APPWRITE_MESSAGES_COLLECTION_ID || 'messages';

async function main() {
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  console.log('🧹 [ServiceZap] Limpando todas as mensagens de teste anteriores...');

  let totalDeleted = 0;
  let hasMore = true;

  while (hasMore) {
    const res = await databases.listDocuments(databaseId, COLLECTION_MESSAGES, [
      Query.limit(100),
    ]);

    if (res.documents.length === 0) {
      hasMore = false;
      break;
    }

    for (const doc of res.documents) {
      try {
        await databases.deleteDocument(databaseId, COLLECTION_MESSAGES, doc.$id);
        totalDeleted++;
      } catch (e: any) {
        console.warn(`Falha ao deletar doc ${doc.$id}:`, e?.message);
      }
    }

    console.log(`Deletadas ${totalDeleted} mensagens até o momento...`);
  }

  console.log(`\n✅ Limpeza completa! Total de ${totalDeleted} mensagens de teste removidas do banco de dados.`);
}

main().catch(console.error);

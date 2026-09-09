import { Client, Databases, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

const COLLECTIONS_TO_PURGE = [
  'clients',
  'invoices',
  'work_orders',
  'services',
  'appointments',
  'messages',
  'whatsapp_instances',
  'audit_logs',
  'labels',
  'quick_replies',
];

async function main() {
  console.log('💥 [ServiceZap] Iniciando RESET COMPLETO da base de dados (Opção 2)...');
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Database ID: ${databaseId}\n`);

  if (!apiKey || !projectId) {
    console.error('❌ Credenciais de Appwrite não encontradas!');
    process.exit(1);
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  // 1. Limpeza de coleções operacionais
  for (const coll of COLLECTIONS_TO_PURGE) {
    try {
      console.log(`🧹 Limpando coleção [${coll.toUpperCase()}]...`);
      let deletedCount = 0;
      let hasMore = true;

      while (hasMore) {
        const res = await databases.listDocuments(databaseId, coll, [Query.limit(100)]);
        if (res.documents.length === 0) {
          hasMore = false;
          break;
        }

        for (const doc of res.documents) {
          try {
            await databases.deleteDocument(databaseId, coll, doc.$id);
            deletedCount++;
          } catch (e: any) {
            console.warn(`Erro ao deletar doc ${doc.$id} em ${coll}:`, e?.message);
          }
        }
      }
      console.log(`   ✅ ${deletedCount} documentos apagados em [${coll}].`);
    } catch (err: any) {
      console.log(`   ⚠️ Coleção [${coll}] ignorada ou não encontrada: ${err?.message}`);
    }
  }

  // 2. Limpeza completa dos arquivos de sessão do WhatsApp em disco
  console.log('\n💾 Limpando sessões do WhatsApp em disco (.whatsapp_sessions)...');
  const sessionsDir = path.resolve(process.cwd(), '.whatsapp_sessions');
  if (fs.existsSync(sessionsDir)) {
    try {
      fs.rmSync(sessionsDir, { recursive: true, force: true });
      fs.mkdirSync(sessionsDir, { recursive: true });
      console.log('   ✅ Diretório .whatsapp_sessions resetado e limpo.');
    } catch (err: any) {
      console.warn('   ⚠️ Erro ao resetar .whatsapp_sessions:', err?.message);
    }
  }

  console.log('\n🎉 [RESET CONCLUÍDO] Toda a base operacional está 100% limpa e zerada!');
}

main().catch(console.error);

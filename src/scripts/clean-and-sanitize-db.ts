import { Client, Databases, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

const COLLECTION_MESSAGES = process.env.APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
const COLLECTION_WHATSAPP = process.env.APPWRITE_COLLECTION_WHATSAPP || 'whatsapp_instances';
const COLLECTION_CLIENTS = process.env.APPWRITE_COLLECTION_CLIENTS || 'clients';

async function main() {
  console.log('🚀 [ServiceZap] Iniciando saneamento e limpeza de dados do banco Appwrite...');
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Project ID: ${projectId}`);
  console.log(`Database ID: ${databaseId}`);

  if (!apiKey || !projectId) {
    console.error('❌ APPWRITE_API_KEY ou NEXT_PUBLIC_APPWRITE_PROJECT_ID não configurados!');
    process.exit(1);
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  // 1. Limpeza de Mensagens sujas / órfãs ou de testes anteriores
  console.log('\n📦 1. Inspecionando coleção de MENSAGENS...');
  try {
    const msgs = await databases.listDocuments(databaseId, COLLECTION_MESSAGES, [
      Query.limit(100),
    ]);
    console.log(`Encontradas ${msgs.total} mensagens registradas.`);

    let deletedCount = 0;
    for (const msg of msgs.documents) {
      const doc: any = msg;
      // Se não tiver tenantId ou se for mensagem de teste/órfã
      if (!doc.tenantId || doc.tenantId === '' || doc.tenantId === 'default') {
        console.log(`🗑️ Removendo mensagem sem tenantId válido: [${doc.$id}] Tel: ${doc.phone}`);
        await databases.deleteDocument(databaseId, COLLECTION_MESSAGES, doc.$id);
        deletedCount++;
      }
    }
    console.log(`✅ ${deletedCount} mensagens órfãs removidas.`);
  } catch (err: any) {
    console.warn('⚠️ Erro ao processar mensagens:', err?.message);
  }

  // 2. Saneamento da coleção de CLIENTES (Garantir tenantId)
  console.log('\n👥 2. Inspecionando coleção de CLIENTES...');
  try {
    const clientsList = await databases.listDocuments(databaseId, COLLECTION_CLIENTS, [
      Query.limit(100),
    ]);
    console.log(`Encontrados ${clientsList.total} clientes.`);

    let fixedClients = 0;
    for (const c of clientsList.documents) {
      const doc: any = c;
      if (!doc.tenantId || doc.tenantId === '') {
        console.log(`🔧 Vinculando cliente [${doc.name || doc.$id}] ao tenant_01...`);
        try {
          await databases.updateDocument(databaseId, COLLECTION_CLIENTS, doc.$id, {
            tenantId: 'tenant_01',
          });
          fixedClients++;
        } catch (e: any) {
          console.warn(`Erro ao atualizar cliente ${doc.$id}:`, e?.message);
        }
      }
    }
    console.log(`✅ ${fixedClients} clientes atualizados com tenantId.`);
  } catch (err: any) {
    console.warn('⚠️ Erro ao processar clientes:', err?.message);
  }

  // 3. Saneamento da coleção WHATSAPP_INSTANCES
  console.log('\n📱 3. Inspecionando instâncias de WHATSAPP...');
  try {
    const instances = await databases.listDocuments(databaseId, COLLECTION_WHATSAPP, [
      Query.limit(100),
    ]);
    console.log(`Encontradas ${instances.total} instâncias.`);

    const validTenants = ['tenant_01', 'tenant_02', 'tenant_master'];
    for (const inst of instances.documents) {
      const doc: any = inst;
      if (!doc.tenantId || !validTenants.includes(doc.tenantId)) {
        console.log(`🗑️ Removendo instância legada sem tenant: [${doc.$id}] ${doc.instanceName}`);
        await databases.deleteDocument(databaseId, COLLECTION_WHATSAPP, doc.$id);
      }
    }
  } catch (err: any) {
    console.warn('⚠️ Erro ao processar instâncias de whatsapp:', err?.message);
  }

  // 4. Limpeza de diretórios de sessão residuais em disco
  console.log('\n💾 4. Verificando sessões em disco (.whatsapp_sessions)...');
  const sessionsDir = path.resolve(process.cwd(), '.whatsapp_sessions');
  if (fs.existsSync(sessionsDir)) {
    const items = fs.readdirSync(sessionsDir);
    for (const item of items) {
      // Se for uma pasta antiga como "servicezap_main" que não seja tenant_01, tenant_02 ou tenant_master
      if (item !== 'tenant_01' && item !== 'tenant_02' && item !== 'tenant_master') {
        const itemPath = path.join(sessionsDir, item);
        try {
          if (fs.lstatSync(itemPath).isDirectory()) {
            console.log(`🗑️ Removendo pasta de sessão legada: ${itemPath}`);
            fs.rmSync(itemPath, { recursive: true, force: true });
          }
        } catch (e: any) {
          console.warn(`Aviso ao remover ${itemPath}:`, e?.message);
        }
      }
    }
    console.log('✅ Diretório .whatsapp_sessions saneado.');
  }

  console.log('\n🎉 Saneamento concluído com sucesso!');
}

main().catch((err) => {
  console.error('❌ Falha na execução do saneamento:', err);
  process.exit(1);
});

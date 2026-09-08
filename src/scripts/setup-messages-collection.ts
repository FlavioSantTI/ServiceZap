import { Client, Databases, DatabasesIndexType } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega variáveis do arquivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const messagesCollectionId = process.env.APPWRITE_MESSAGES_COLLECTION_ID || 'messages';

if (!projectId || !apiKey) {
  console.error('❌ Erro: NEXT_PUBLIC_APPWRITE_PROJECT_ID e APPWRITE_API_KEY precisam estar definidos no .env.local');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function setupMessagesCollection() {
  console.log('🚀 Iniciando configuração da coleção "messages" no Appwrite...');

  // 1. Detecta o banco de dados
  let targetDbId = databaseId;
  try {
    const existingDbs = await databases.list();
    if (existingDbs.databases.length > 0) {
      const found = existingDbs.databases.find(db => db.$id.toLowerCase() === databaseId.toLowerCase());
      targetDbId = found ? found.$id : existingDbs.databases[0].$id;
      console.log(`✅ Banco de dados selecionado: "${targetDbId}"`);
    }
  } catch (err) {
    console.log(`ℹ️ Usando Database ID configurado: "${targetDbId}"`);
  }

  // 2. Garante existência da coleção
  try {
    await databases.getCollection(targetDbId, messagesCollectionId);
    console.log(`ℹ️ Coleção "messages" (${messagesCollectionId}) já existe.`);
  } catch {
    console.log(`🔨 Criando coleção "messages" (${messagesCollectionId})...`);
    await databases.createCollection(targetDbId, messagesCollectionId, 'Mensagens WhatsApp');
    console.log(`✅ Coleção criada com sucesso!`);
  }

  // Helper para criar atributos com verificação e defaults para retrocompatibilidade
  async function ensureStringAttribute(key: string, size: number, defaultValue: string = '') {
    try {
      await databases.getAttribute(targetDbId, messagesCollectionId, key);
      console.log(`  ✓ Atributo string "${key}" já existe.`);
    } catch {
      console.log(`  + Criando atributo string "${key}" (size: ${size}, default: "${defaultValue}")...`);
      // required: false com defaultValue garante retrocompatibilidade total com documentos legados
      await databases.createStringAttribute(targetDbId, messagesCollectionId, key, size, false, defaultValue);
    }
  }

  async function ensureEnumAttribute(key: string, elements: string[], defaultValue: string) {
    try {
      await databases.getAttribute(targetDbId, messagesCollectionId, key);
      console.log(`  ✓ Atributo enum "${key}" já existe.`);
    } catch {
      console.log(`  + Criando atributo enum "${key}" (elements: [${elements.join(', ')}], default: "${defaultValue}")...`);
      await databases.createEnumAttribute(targetDbId, messagesCollectionId, key, elements, false, defaultValue);
    }
  }

  async function ensureIndex(key: string, type: DatabasesIndexType, attributes: string[]) {
    try {
      await databases.getIndex(targetDbId, messagesCollectionId, key);
      console.log(`  ✓ Índice "${key}" já existe.`);
    } catch {
      console.log(`  ⚡ Criando índice "${key}" (${type}) sobre [${attributes.join(', ')}]...`);
      await databases.createIndex(targetDbId, messagesCollectionId, key, type, attributes);
    }
  }

  console.log('📐 Configurando atributos da coleção "messages" com defaults para retrocompatibilidade...');

  // 1. phone (string, max 32, default: '')
  await ensureStringAttribute('phone', 32, '');

  // 2. content (string, max 4096, default: '')
  await ensureStringAttribute('content', 4096, '');

  // 3. direction (enum: "inbound", "outbound", default: "inbound")
  await ensureEnumAttribute('direction', ['inbound', 'outbound'], 'inbound');

  // 4. status (enum: "pending", "sent", "delivered", "received", "failed", default: "received")
  await ensureEnumAttribute('status', ['pending', 'sent', 'delivered', 'received', 'failed'], 'received');

  // 5. origin (enum: "app_ui", "whatsapp_native", default: "whatsapp_native")
  await ensureEnumAttribute('origin', ['app_ui', 'whatsapp_native'], 'whatsapp_native');

  // 6. whatsapp_message_id (string, max 128, default: '')
  await ensureStringAttribute('whatsapp_message_id', 128, '');

  // 7. created_at (string, max 64, default: '')
  await ensureStringAttribute('created_at', 64, '');

  // 8. tenantId (string, max 255, default: 'default') - para compatibilidade multi-tenant
  await ensureStringAttribute('tenantId', 255, 'default');

  // 9. Atributos de Mídia & Anexos
  await ensureStringAttribute('mediaType', 32, '');
  await ensureStringAttribute('mediaUrl', 2048, '');
  await ensureStringAttribute('mimeType', 128, '');
  await ensureStringAttribute('fileName', 255, '');

  console.log('⚡ Configurando índices de alta performance...');

  // Índice essencial para idempotência e buscas rápidas de de-duplicação
  await ensureIndex('idx_messages_wamid', DatabasesIndexType.Key, ['whatsapp_message_id']);

  // Índices para consultas de histórico na UI por telefone e ordenação cronológica
  await ensureIndex('idx_messages_phone', DatabasesIndexType.Key, ['phone']);
  await ensureIndex('idx_messages_created_at', DatabasesIndexType.Key, ['created_at']);

  console.log('✨ Configuração da coleção "messages" concluída com 100% de sucesso!');
}

setupMessagesCollection().catch((err) => {
  console.error('❌ Falha ao configurar a coleção messages:', err);
  process.exit(1);
});

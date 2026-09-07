import { Client, Databases, DatabasesIndexType } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega variáveis do arquivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

if (!projectId || !apiKey) {
  console.error('❌ Erro: NEXT_PUBLIC_APPWRITE_PROJECT_ID e APPWRITE_API_KEY precisam estar definidos no .env.local');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function setupDatabase() {
  console.log('🚀 Iniciando configuração completa do Banco de Dados Appwrite...');

  // 1. Criar ou Detectar Banco de Dados
  let targetDbId = databaseId;
  try {
    const existingDbs = await databases.list();
    if (existingDbs.databases.length > 0) {
      const found = existingDbs.databases.find(db => db.$id.toLowerCase() === databaseId.toLowerCase());
      targetDbId = found ? found.$id : existingDbs.databases[0].$id;
      console.log(`✅ Banco de dados encontrado no Appwrite: "${targetDbId}" (${existingDbs.databases[0].name})`);
    } else {
      console.log(`🔨 Criando banco de dados "${databaseId}"...`);
      await databases.create(databaseId, 'ServiceZap Database');
      console.log(`✅ Banco de dados "${databaseId}" criado com sucesso!`);
    }
  } catch (err: any) {
    console.log(`ℹ️ Usando ID do banco: "${targetDbId}"`);
  }

  // Helpers para atributos usando o targetDbId correto
  async function createStringAttributeIfNotExists(colId: string, key: string, size: number, required: boolean = false) {
    try {
      await databases.getAttribute(targetDbId, colId, key);
    } catch {
      console.log(`    + Atributo string "${key}" na coleção "${colId}"`);
      await databases.createStringAttribute(targetDbId, colId, key, size, required);
    }
  }

  async function createFloatAttributeIfNotExists(colId: string, key: string, required: boolean = false) {
    try {
      await databases.getAttribute(targetDbId, colId, key);
    } catch {
      console.log(`    + Atributo float "${key}" na coleção "${colId}"`);
      await databases.createFloatAttribute(targetDbId, colId, key, required);
    }
  }

  async function createIntegerAttributeIfNotExists(colId: string, key: string, required: boolean = false) {
    try {
      await databases.getAttribute(targetDbId, colId, key);
    } catch {
      console.log(`    + Atributo integer "${key}" na coleção "${colId}"`);
      await databases.createIntegerAttribute(targetDbId, colId, key, required);
    }
  }

  async function createBooleanAttributeIfNotExists(colId: string, key: string, required: boolean = false, defaultValue?: boolean) {
    try {
      await databases.getAttribute(targetDbId, colId, key);
    } catch {
      console.log(`    + Atributo boolean "${key}" na coleção "${colId}"`);
      if (required) {
        await databases.createBooleanAttribute(targetDbId, colId, key, true);
      } else {
        await databases.createBooleanAttribute(targetDbId, colId, key, false, defaultValue ?? true);
      }
    }
  }

  async function createIndexIfNotExists(colId: string, key: string, type: DatabasesIndexType, attributes: string[]) {
    try {
      await databases.getIndex(targetDbId, colId, key);
    } catch {
      console.log(`    ⚡ Índice "${key}" na coleção "${colId}"`);
      await databases.createIndex(targetDbId, colId, key, type, attributes);
    }
  }

  // 2. Helper para criar coleção
  async function ensureCollection(colId: string, name: string) {
    try {
      await databases.getCollection(targetDbId, colId);
      console.log(`  ℹ️ Coleção "${name}" (${colId}) ok.`);
    } catch (err: any) {
      if (err.type === 'general_unauthorized_scope' || err.code === 401) {
        console.error(`\n⚠️ ATENÇÃO: A sua API Key precisa da permissão "${err.message.includes('collections.write') ? 'collections.write' : 'Database / Collections'}" habilitada no Appwrite Console!`);
        console.error(`👉 Acesse https://cloud.appwrite.io -> Seu Projeto -> Settings -> API Keys -> Editar Chave -> Marque os escopos de Database (collections.write, documents.write, etc.) e clique em Save.\n`);
        throw err;
      }
      console.log(`  🔨 Criando coleção "${name}" (${colId})...`);
      await databases.createCollection(targetDbId, colId, name);
    }
  }

  await ensureCollection('tenants', 'Tenants');
  await ensureCollection('services', 'Catálogo de Serviços');
  await ensureCollection('users', 'Usuários');
  await ensureCollection('clients', 'Clientes');
  await ensureCollection('invoices', 'Faturas e Notas Fiscais');
  await ensureCollection('whatsapp_instances', 'Instâncias WhatsApp');

  console.log('📐 Configurando Atributos e Índices das Coleções...');

  // 3. Atributos da Coleção: tenants
  await createStringAttributeIfNotExists('tenants', 'name', 255, true);
  await createStringAttributeIfNotExists('tenants', 'companyName', 255);
  await createStringAttributeIfNotExists('tenants', 'document', 30, true);
  await createStringAttributeIfNotExists('tenants', 'email', 255, true);
  await createStringAttributeIfNotExists('tenants', 'phone', 30);
  await createStringAttributeIfNotExists('tenants', 'plan', 50, true);
  await createStringAttributeIfNotExists('tenants', 'status', 50, true);
  await createStringAttributeIfNotExists('tenants', 'pixKey', 255);
  await createStringAttributeIfNotExists('tenants', 'pixKeyType', 50);
  await createStringAttributeIfNotExists('tenants', 'asaasCustomerId', 255);
  await createStringAttributeIfNotExists('tenants', 'taxRegime', 50);
  await createStringAttributeIfNotExists('tenants', 'municipalRegistration', 50);
  await createFloatAttributeIfNotExists('tenants', 'issRate');
  await createIndexIfNotExists('tenants', 'idx_tenant_document', DatabasesIndexType.Unique, ['document']);

  // 4. Atributos da Coleção: services
  await createStringAttributeIfNotExists('services', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('services', 'name', 255, true);
  await createStringAttributeIfNotExists('services', 'description', 1000);
  await createFloatAttributeIfNotExists('services', 'price', true);
  await createIntegerAttributeIfNotExists('services', 'durationMinutes', true);
  await createStringAttributeIfNotExists('services', 'category', 100, true);
  await createBooleanAttributeIfNotExists('services', 'active', true, true);
  await createIndexIfNotExists('services', 'idx_services_tenant', DatabasesIndexType.Key, ['tenantId']);

  // 5. Atributos da Coleção: clients
  await createStringAttributeIfNotExists('clients', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('clients', 'name', 255, true);
  await createStringAttributeIfNotExists('clients', 'document', 30, true);
  await createStringAttributeIfNotExists('clients', 'email', 255, true);
  await createStringAttributeIfNotExists('clients', 'phone', 30, true);
  await createStringAttributeIfNotExists('clients', 'status', 50, true);
  await createFloatAttributeIfNotExists('clients', 'totalPaid');
  await createIntegerAttributeIfNotExists('clients', 'totalInvoices');
  await createStringAttributeIfNotExists('clients', 'address', 255);
  await createStringAttributeIfNotExists('clients', 'addressNumber', 50);
  await createStringAttributeIfNotExists('clients', 'neighborhood', 100);
  await createStringAttributeIfNotExists('clients', 'city', 100);
  await createStringAttributeIfNotExists('clients', 'state', 10);
  await createStringAttributeIfNotExists('clients', 'zipCode', 20);
  await createStringAttributeIfNotExists('clients', 'notes', 1000);
  await createStringAttributeIfNotExists('clients', 'asaasCustomerId', 255);
  await createIndexIfNotExists('clients', 'idx_clients_tenant', DatabasesIndexType.Key, ['tenantId']);

  // 6. Atributos da Coleção: invoices
  await createStringAttributeIfNotExists('invoices', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('invoices', 'clientId', 255, true);
  await createStringAttributeIfNotExists('invoices', 'clientName', 255, true);
  await createStringAttributeIfNotExists('invoices', 'serviceId', 255);
  await createFloatAttributeIfNotExists('invoices', 'amount', true);
  await createStringAttributeIfNotExists('invoices', 'dueDate', 30, true);
  await createStringAttributeIfNotExists('invoices', 'status', 50, true);
  await createStringAttributeIfNotExists('invoices', 'description', 1000);
  await createStringAttributeIfNotExists('invoices', 'asaasPaymentId', 255);
  await createStringAttributeIfNotExists('invoices', 'pixQrCodeUrl', 1000);
  await createStringAttributeIfNotExists('invoices', 'pixCopyPaste', 2000);
  await createStringAttributeIfNotExists('invoices', 'nfeStatus', 50, true);
  await createStringAttributeIfNotExists('invoices', 'nfeNumber', 50);
  await createIndexIfNotExists('invoices', 'idx_invoices_tenant', DatabasesIndexType.Key, ['tenantId']);
  await createIndexIfNotExists('invoices', 'idx_invoices_status', DatabasesIndexType.Key, ['status']);

  // 7. Atributos da Coleção: whatsapp_instances
  await createStringAttributeIfNotExists('whatsapp_instances', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('whatsapp_instances', 'instanceName', 255, true);
  await createStringAttributeIfNotExists('whatsapp_instances', 'instanceId', 255, true);
  await createStringAttributeIfNotExists('whatsapp_instances', 'status', 50, true);
  await createStringAttributeIfNotExists('whatsapp_instances', 'phone', 30);
  await createStringAttributeIfNotExists('whatsapp_instances', 'updatedAt', 50);
  await createIndexIfNotExists('whatsapp_instances', 'idx_wa_tenant', DatabasesIndexType.Key, ['tenantId']);

  console.log('✨ Configuração completa de Banco, Coleções, Atributos e Índices finalizada!');
}

setupDatabase().catch((err) => {
  console.error('❌ Erro ao configurar banco Appwrite:', err);
  process.exit(1);
});

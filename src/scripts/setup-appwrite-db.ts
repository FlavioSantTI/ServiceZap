import { Client, Databases, DatabasesIndexType, ID } from 'node-appwrite';
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
  async function createStringAttributeIfNotExists(
    colId: string,
    key: string,
    size: number,
    required: boolean = false,
    defaultValue?: string
  ) {
    try {
      await databases.getAttribute(targetDbId, colId, key);
    } catch {
      console.log(`    + Atributo string "${key}" na coleção "${colId}"`);
      if (defaultValue !== undefined && !required) {
        await databases.createStringAttribute(targetDbId, colId, key, size, false, defaultValue);
      } else {
        await databases.createStringAttribute(targetDbId, colId, key, size, required);
      }
    }
  }

  async function createFloatAttributeIfNotExists(
    colId: string,
    key: string,
    required: boolean = false,
    defaultValue?: number
  ) {
    try {
      await databases.getAttribute(targetDbId, colId, key);
    } catch {
      console.log(`    + Atributo float "${key}" na coleção "${colId}"`);
      if (defaultValue !== undefined && !required) {
        await databases.createFloatAttribute(targetDbId, colId, key, false, undefined, defaultValue);
      } else {
        await databases.createFloatAttribute(targetDbId, colId, key, required);
      }
    }
  }

  async function createIntegerAttributeIfNotExists(
    colId: string,
    key: string,
    required: boolean = false,
    defaultValue?: number
  ) {
    try {
      await databases.getAttribute(targetDbId, colId, key);
    } catch {
      console.log(`    + Atributo integer "${key}" na coleção "${colId}"`);
      if (defaultValue !== undefined && !required) {
        await databases.createIntegerAttribute(targetDbId, colId, key, false, undefined, undefined, defaultValue);
      } else {
        await databases.createIntegerAttribute(targetDbId, colId, key, required);
      }
    }
  }

  async function createBooleanAttributeIfNotExists(
    colId: string,
    key: string,
    required: boolean = false,
    defaultValue?: boolean
  ) {
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
      try {
        await databases.createIndex(targetDbId, colId, key, type, attributes);
      } catch (idxErr: any) {
        console.warn(`    ⚠️ Aviso ao criar índice ${key}:`, idxErr?.message);
      }
    }
  }

  // 2. Helper para criar coleção
  async function ensureCollection(colId: string, name: string) {
    try {
      await databases.getCollection(targetDbId, colId);
      console.log(`  ℹ️ Coleção "${name}" (${colId}) ok.`);
    } catch (err: any) {
      if (err.type === 'general_unauthorized_scope' || err.code === 401) {
        console.error(`\n⚠️ ATENÇÃO: A sua API Key precisa da permissão "${err.message?.includes('collections.write') ? 'collections.write' : 'Database / Collections'}" habilitada no Appwrite Console!`);
        throw err;
      }
      console.log(`  🔨 Criando coleção "${name}" (${colId})...`);
      await databases.createCollection(targetDbId, colId, name);
    }
  }

  // Garantir existência de todas as coleções
  await ensureCollection('tenants', 'Tenants');
  await ensureCollection('services', 'Catálogo de Serviços');
  await ensureCollection('users', 'Usuários');
  await ensureCollection('clients', 'Clientes');
  await ensureCollection('invoices', 'Faturas e Notas Fiscais');
  await ensureCollection('work_orders', 'Ordens de Serviço e Orçamentos');
  await ensureCollection('appointments', 'Agenda e Atendimentos');
  await ensureCollection('audit_logs', 'Trilha de Auditoria');
  await ensureCollection('quick_replies', 'Respostas Rápidas');
  await ensureCollection('labels', 'Etiquetas e Rótulos');
  await ensureCollection('whatsapp_instances', 'Instâncias WhatsApp');
  await ensureCollection('saas_plans', 'Planos SaaS');

  console.log('📐 Configurando Atributos e Índices das Coleções...');

  // 3. Atributos da Coleção: tenants
  await createStringAttributeIfNotExists('tenants', 'name', 255, true);
  await createStringAttributeIfNotExists('tenants', 'companyName', 255);
  await createStringAttributeIfNotExists('tenants', 'personType', 20, false, 'pj');
  await createStringAttributeIfNotExists('tenants', 'profession', 255);
  await createStringAttributeIfNotExists('tenants', 'document', 30, true);
  await createStringAttributeIfNotExists('tenants', 'email', 255, true);
  await createStringAttributeIfNotExists('tenants', 'phone', 30);
  await createStringAttributeIfNotExists('tenants', 'plan', 50, true);
  await createStringAttributeIfNotExists('tenants', 'status', 50, true);
  await createIntegerAttributeIfNotExists('tenants', 'maxUsers', false, 5);
  await createStringAttributeIfNotExists('tenants', 'ownerName', 255);
  await createStringAttributeIfNotExists('tenants', 'ownerEmail', 255);
  await createStringAttributeIfNotExists('tenants', 'pixKey', 255);
  await createStringAttributeIfNotExists('tenants', 'pixKeyType', 50);
  await createStringAttributeIfNotExists('tenants', 'asaasCustomerId', 255);
  await createStringAttributeIfNotExists('tenants', 'stripeCustomerId', 255);
  await createStringAttributeIfNotExists('tenants', 'taxRegime', 50);
  await createStringAttributeIfNotExists('tenants', 'municipalRegistration', 50);
  await createFloatAttributeIfNotExists('tenants', 'issRate');
  await createStringAttributeIfNotExists('tenants', 'featuresJson', 5000);
  await createStringAttributeIfNotExists('tenants', 'logoUrl', 1000);
  await createStringAttributeIfNotExists('tenants', 'address', 255);
  await createStringAttributeIfNotExists('tenants', 'addressNumber', 50);
  await createStringAttributeIfNotExists('tenants', 'neighborhood', 100);
  await createStringAttributeIfNotExists('tenants', 'city', 100);
  await createStringAttributeIfNotExists('tenants', 'state', 10);
  await createStringAttributeIfNotExists('tenants', 'zipCode', 20);
  await createIndexIfNotExists('tenants', 'idx_tenant_document', DatabasesIndexType.Unique, ['document']);

  // 4. Atributos da Coleção: users
  await createStringAttributeIfNotExists('users', 'userId', 255, true);
  await createStringAttributeIfNotExists('users', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('users', 'name', 255, true);
  await createStringAttributeIfNotExists('users', 'email', 255, true);
  await createStringAttributeIfNotExists('users', 'phone', 30);
  await createStringAttributeIfNotExists('users', 'role', 50, true);
  await createStringAttributeIfNotExists('users', 'permissionsJson', 5000);
  await createStringAttributeIfNotExists('users', 'avatarUrl', 1000);
  await createBooleanAttributeIfNotExists('users', 'active', false, true);
  await createIndexIfNotExists('users', 'idx_users_tenant', DatabasesIndexType.Key, ['tenantId']);

  // 5. Atributos da Coleção: services
  await createStringAttributeIfNotExists('services', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('services', 'name', 255, true);
  await createStringAttributeIfNotExists('services', 'description', 1000);
  await createFloatAttributeIfNotExists('services', 'price', true);
  await createIntegerAttributeIfNotExists('services', 'durationMinutes', true);
  await createStringAttributeIfNotExists('services', 'category', 100, true);
  await createStringAttributeIfNotExists('services', 'unit', 50, false, 'un');
  await createBooleanAttributeIfNotExists('services', 'active', true, true);
  await createIndexIfNotExists('services', 'idx_services_tenant', DatabasesIndexType.Key, ['tenantId']);

  // 6. Atributos da Coleção: clients
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
  await createStringAttributeIfNotExists('clients', 'labels', 2000);
  await createIndexIfNotExists('clients', 'idx_clients_tenant', DatabasesIndexType.Key, ['tenantId']);

  // 7. Atributos da Coleção: invoices
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
  await createStringAttributeIfNotExists('invoices', 'bankSlipUrl', 1000);
  await createStringAttributeIfNotExists('invoices', 'nfeStatus', 50, true);
  await createStringAttributeIfNotExists('invoices', 'nfeId', 255);
  await createStringAttributeIfNotExists('invoices', 'nfeNumber', 50);
  await createStringAttributeIfNotExists('invoices', 'nfePdfUrl', 1000);
  await createStringAttributeIfNotExists('invoices', 'nfeXmlUrl', 1000);
  await createStringAttributeIfNotExists('invoices', 'nfeErrorReason', 1000);
  await createIndexIfNotExists('invoices', 'idx_invoices_tenant', DatabasesIndexType.Key, ['tenantId']);
  await createIndexIfNotExists('invoices', 'idx_invoices_status', DatabasesIndexType.Key, ['status']);

  // 8. Atributos da Coleção: work_orders
  await createStringAttributeIfNotExists('work_orders', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('work_orders', 'type', 50, true);
  await createStringAttributeIfNotExists('work_orders', 'number', 50, true);
  await createStringAttributeIfNotExists('work_orders', 'clientId', 255, true);
  await createStringAttributeIfNotExists('work_orders', 'clientName', 255, true);
  await createStringAttributeIfNotExists('work_orders', 'clientPhone', 30);
  await createStringAttributeIfNotExists('work_orders', 'clientEmail', 255);
  await createStringAttributeIfNotExists('work_orders', 'serviceId', 255);
  await createStringAttributeIfNotExists('work_orders', 'serviceName', 255);
  await createStringAttributeIfNotExists('work_orders', 'itemsJson', 10000);
  await createFloatAttributeIfNotExists('work_orders', 'amount', true);
  await createFloatAttributeIfNotExists('work_orders', 'discount');
  await createStringAttributeIfNotExists('work_orders', 'status', 50, true);
  await createStringAttributeIfNotExists('work_orders', 'dueDate', 50);
  await createStringAttributeIfNotExists('work_orders', 'executionDate', 50);
  await createStringAttributeIfNotExists('work_orders', 'notes', 3000);
  await createStringAttributeIfNotExists('work_orders', 'invoiceId', 255);
  await createIndexIfNotExists('work_orders', 'idx_wo_tenant', DatabasesIndexType.Key, ['tenantId']);

  // 9. Atributos da Coleção: appointments
  await createStringAttributeIfNotExists('appointments', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('appointments', 'clientId', 255);
  await createStringAttributeIfNotExists('appointments', 'clientName', 255, true);
  await createStringAttributeIfNotExists('appointments', 'clientPhone', 30);
  await createStringAttributeIfNotExists('appointments', 'serviceId', 255);
  await createStringAttributeIfNotExists('appointments', 'serviceName', 255);
  await createStringAttributeIfNotExists('appointments', 'attendantName', 255);
  await createStringAttributeIfNotExists('appointments', 'date', 50, true);
  await createStringAttributeIfNotExists('appointments', 'time', 20, true);
  await createIntegerAttributeIfNotExists('appointments', 'durationMinutes');
  await createStringAttributeIfNotExists('appointments', 'status', 50, true);
  await createStringAttributeIfNotExists('appointments', 'location', 255);
  await createStringAttributeIfNotExists('appointments', 'notes', 2000);
  await createBooleanAttributeIfNotExists('appointments', 'reminderSent', false, false);
  await createIndexIfNotExists('appointments', 'idx_app_tenant', DatabasesIndexType.Key, ['tenantId']);

  // 10. Atributos da Coleção: audit_logs
  await createStringAttributeIfNotExists('audit_logs', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('audit_logs', 'userId', 255);
  await createStringAttributeIfNotExists('audit_logs', 'userName', 255);
  await createStringAttributeIfNotExists('audit_logs', 'userEmail', 255);
  await createStringAttributeIfNotExists('audit_logs', 'userRole', 50);
  await createStringAttributeIfNotExists('audit_logs', 'action', 100, true);
  await createStringAttributeIfNotExists('audit_logs', 'category', 50);
  await createStringAttributeIfNotExists('audit_logs', 'entityId', 255);
  await createStringAttributeIfNotExists('audit_logs', 'entityName', 255);
  await createStringAttributeIfNotExists('audit_logs', 'details', 5000);
  await createStringAttributeIfNotExists('audit_logs', 'ipAddress', 50);
  await createStringAttributeIfNotExists('audit_logs', 'created_at', 50);
  await createIndexIfNotExists('audit_logs', 'idx_audit_tenant', DatabasesIndexType.Key, ['tenantId']);

  // 11. Atributos da Coleção: quick_replies
  await createStringAttributeIfNotExists('quick_replies', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('quick_replies', 'title', 255, true);
  await createStringAttributeIfNotExists('quick_replies', 'shortcut', 50, true);
  await createStringAttributeIfNotExists('quick_replies', 'content', 2000, true);
  await createStringAttributeIfNotExists('quick_replies', 'category', 100);
  await createIndexIfNotExists('quick_replies', 'idx_qr_tenant', DatabasesIndexType.Key, ['tenantId']);

  // 12. Atributos da Coleção: labels
  await createStringAttributeIfNotExists('labels', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('labels', 'name', 100, true);
  await createStringAttributeIfNotExists('labels', 'color', 50, true);
  await createStringAttributeIfNotExists('labels', 'description', 500);
  await createIndexIfNotExists('labels', 'idx_labels_tenant', DatabasesIndexType.Key, ['tenantId']);

  // 13. Atributos da Coleção: whatsapp_instances
  await createStringAttributeIfNotExists('whatsapp_instances', 'tenantId', 255, true);
  await createStringAttributeIfNotExists('whatsapp_instances', 'instanceName', 255, true);
  await createStringAttributeIfNotExists('whatsapp_instances', 'instanceId', 255, true);
  await createStringAttributeIfNotExists('whatsapp_instances', 'status', 50, true);
  await createStringAttributeIfNotExists('whatsapp_instances', 'phone', 30);
  await createStringAttributeIfNotExists('whatsapp_instances', 'updatedAt', 50);
  await createIndexIfNotExists('whatsapp_instances', 'idx_wa_tenant', DatabasesIndexType.Key, ['tenantId']);

  // 14. Atributos da Coleção: saas_plans
  await createStringAttributeIfNotExists('saas_plans', 'planId', 50, true);
  await createStringAttributeIfNotExists('saas_plans', 'name', 100, true);
  await createStringAttributeIfNotExists('saas_plans', 'badge', 50);
  await createStringAttributeIfNotExists('saas_plans', 'description', 500);
  await createBooleanAttributeIfNotExists('saas_plans', 'popular', false, false);
  await createFloatAttributeIfNotExists('saas_plans', 'priceMonthly', true);
  await createFloatAttributeIfNotExists('saas_plans', 'priceYearly', false);
  await createStringAttributeIfNotExists('saas_plans', 'limitsJson', 1000);
  await createStringAttributeIfNotExists('saas_plans', 'featuresJson', 1000);
  await createStringAttributeIfNotExists('saas_plans', 'featureListJson', 1500);

  console.log('✨ Configuração completa de Banco, Coleções, Atributos e Índices finalizada!');
}

setupDatabase().catch((err) => {
  console.error('❌ Erro ao configurar banco Appwrite:', err);
  process.exit(1);
});

import { Client, Databases, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

const COLLECTIONS = [
  'clients',
  'invoices',
  'work_orders',
  'services',
  'appointments',
  'labels',
  'contact_labels',
  'quick_replies',
  'users',
  'tenants',
  'saas_plans',
  'audit_logs',
  'whatsapp_instances',
  'messages',
];

async function main() {
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  console.log('🔍 [ServiceZap] Mapeando e auditando todas as coleções do Appwrite...\n');

  for (const collName of COLLECTIONS) {
    try {
      const res = await databases.listDocuments(databaseId, collName, [Query.limit(100)]);
      const tenantDistribution: Record<string, number> = {};
      let missingTenantCount = 0;

      for (const doc of res.documents) {
        const t = (doc as any).tenantId;
        if (!t) {
          missingTenantCount++;
        } else {
          tenantDistribution[t] = (tenantDistribution[t] || 0) + 1;
        }
      }

      console.log(`📁 Coleção: [${collName.toUpperCase()}]`);
      console.log(`   Total de Documentos: ${res.total}`);
      console.log(`   Por Tenant:`, tenantDistribution);
      if (missingTenantCount > 0) {
        console.log(`   ⚠️ Sem tenantId: ${missingTenantCount} documentos!`);
      }
      console.log('--------------------------------------------------');
    } catch (err: any) {
      console.log(`📁 Coleção: [${collName.toUpperCase()}] -> ⚠️ Não encontrada ou erro: ${err?.message}`);
      console.log('--------------------------------------------------');
    }
  }
}

main().catch(console.error);

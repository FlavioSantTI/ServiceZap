import { Client, Databases, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_MESSAGES = process.env.APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
const COLLECTION_WHATSAPP = process.env.APPWRITE_COLLECTION_WHATSAPP || 'whatsapp_instances';

async function main() {
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  console.log('--- WHATSAPP INSTANCES ---');
  const instances = await databases.listDocuments(databaseId, COLLECTION_WHATSAPP);
  for (const inst of instances.documents) {
    console.log(`ID: ${inst.$id} | Tenant: ${(inst as any).tenantId} | Status: ${(inst as any).status} | Phone: ${(inst as any).phone} | Name: ${(inst as any).instanceName}`);
  }

  console.log('\n--- MESSAGES SUMMARY ---');
  const msgs = await databases.listDocuments(databaseId, COLLECTION_MESSAGES, [Query.limit(100)]);
  const tenantCount: Record<string, number> = {};
  const phoneCount: Record<string, number> = {};
  
  for (const msg of msgs.documents) {
    const t = (msg as any).tenantId || 'NO_TENANT';
    const p = (msg as any).phone || 'NO_PHONE';
    tenantCount[t] = (tenantCount[t] || 0) + 1;
    phoneCount[p] = (phoneCount[p] || 0) + 1;
  }

  console.log('Distribuição por TenantId:', tenantCount);
  console.log('Distribuição por Phone:', phoneCount);
}

main().catch(console.error);

import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

async function main() {
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  console.log('--- TENANTS ---');
  const tenants = await databases.listDocuments(databaseId, 'tenants');
  for (const t of tenants.documents) {
    console.log(JSON.stringify(t, null, 2));
  }

  console.log('\n--- USERS ---');
  const users = await databases.listDocuments(databaseId, 'users');
  for (const u of users.documents) {
    console.log(JSON.stringify(u, null, 2));
  }
}

main().catch(console.error);

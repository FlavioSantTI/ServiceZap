import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

if (!projectId || !apiKey) {
  console.error('Missing config');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function main() {
  try {
    const list = await databases.list();
    const dbId = list.databases.length > 0 ? list.databases[0].$id : databaseId;
    console.log('Database ID:', dbId);

    const col = await databases.getCollection(dbId, 'services');
    console.log('Services attributes:', col.attributes.map((a: any) => `${a.key} (${a.status})`));

    const keys = col.attributes.map((a: any) => a.key);
    if (!keys.includes('unit')) {
      console.log('Creating unit attribute on services...');
      await databases.createStringAttribute(dbId, 'services', 'unit', 30, false, 'un');
      console.log('✅ Created unit attribute on services');
    } else {
      console.log('ℹ️ unit attribute already exists on services');
    }
  } catch (err: any) {
    console.error('Error:', err.message || err);
  }
}

main();

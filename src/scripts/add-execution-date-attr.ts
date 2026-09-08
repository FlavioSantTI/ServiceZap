import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

if (!projectId || !apiKey) {
  console.error('❌ Erro: Configurações de API Appwrite ausentes.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function main() {
  console.log('Verificando coleções no Appwrite...');
  try {
    const list = await databases.list();
    const targetDbId = list.databases.length > 0 ? list.databases[0].$id : databaseId;
    console.log('Database ID:', targetDbId);

    const col = await databases.getCollection(targetDbId, 'work_orders');
    console.log('Atributos atuais de work_orders:', col.attributes.map((a: any) => `${a.key} (${a.status})`));

    const existingKeys = col.attributes.map((a: any) => a.key);
    if (!existingKeys.includes('executionDate')) {
      console.log('Criando atributo "executionDate" em work_orders...');
      await databases.createStringAttribute(targetDbId, 'work_orders', 'executionDate', 50, false);
      console.log('✅ Atributo "executionDate" criado com sucesso!');
    } else {
      console.log('ℹ️ Atributo "executionDate" já existe.');
    }
  } catch (e: any) {
    console.error('Erro:', e.message || e);
  }
}

main();

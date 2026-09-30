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

  const res = await databases.listDocuments(databaseId, 'saas_plans');
  console.log('Documentos em saas_plans:');
  for (const doc of res.documents) {
    console.log({
      $id: doc.$id,
      planId: doc.planId,
      name: doc.name,
      priceMonthly: doc.priceMonthly,
      limitsJson: doc.limitsJson,
      featuresJson: doc.featuresJson,
      featureListJson: doc.featureListJson,
    });
  }
}

main().catch(console.error);

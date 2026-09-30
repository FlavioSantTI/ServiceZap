require('dotenv').config({ path: '.env.local' });
const { Client, Databases, Permission, Role } = require('node-appwrite');

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

const fullPermissions = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

async function updateAllCollections() {
  console.log('Fetching collections...');
  const list = await databases.listCollections(databaseId);
  for (const col of list.collections) {
    try {
      console.log(`Updating collection permissions: ${col.$id} (${col.name})...`);
      await databases.updateCollection(
        databaseId,
        col.$id,
        col.name,
        fullPermissions,
        false, // documentSecurity
        true   // enabled
      );
      console.log(`✅ Collection ${col.$id} updated successfully with full permissions!`);
    } catch (e) {
      console.error(`❌ Failed to update collection ${col.$id}:`, e.message);
    }
  }
}

updateAllCollections().then(() => console.log('All collections configured!')).catch(console.error);

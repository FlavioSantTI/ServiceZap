require('dotenv').config({ path: '.env.local' });
const { Client, Databases, Permission, Role, ID } = require('node-appwrite');

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

console.log('Testing Appwrite config:');
console.log('Endpoint:', endpoint);
console.log('ProjectId:', projectId);
console.log('ApiKey length:', apiKey ? apiKey.length : 0);
console.log('DatabaseId:', databaseId);

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function run() {
  try {
    const list = await databases.listCollections(databaseId);
    console.log('Collections count:', list.total);
    for (const col of list.collections) {
      console.log(`- ${col.$id} (${col.name}): documentSecurity=${col.documentSecurity}, permissions=${JSON.stringify(col.permissions)}`);
    }

    // Try create a dummy tenant to test
    const testPayload = {
      name: 'Test Debug Tenant',
      companyName: 'Test Debug Tenant LTDA',
      personType: 'pj',
      document: '99999999000199',
      email: 'test@debug.com',
      phone: '11999999999',
      plan: 'pro',
      status: 'active',
      maxUsers: 5,
      ownerName: 'Admin Debug',
      ownerEmail: 'test@debug.com'
    };

    console.log('Testing createDocument with permissions...');
    const doc = await databases.createDocument(
      databaseId,
      'tenants',
      ID.unique(),
      testPayload,
      [
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    );
    console.log('SUCCESS created test doc:', doc.$id);

    console.log('Testing users.create...');
    const { Users } = require('node-appwrite');
    const users = new Users(client);
    const testEmail = `test_${Date.now()}@debug.com`;
    const user = await users.create(
      ID.unique(),
      testEmail,
      undefined,
      'Password123!',
      'Test User'
    );
    console.log('SUCCESS created user:', user.$id);
    await users.delete(user.$id);
    console.log('Cleaned up user.');

    // Clean up
    await databases.deleteDocument(databaseId, 'tenants', doc.$id);
    console.log('Cleaned up test doc.');
  } catch (err) {
    console.error('ERROR in test:', err.message, 'Code:', err.code, 'Type:', err.type, 'Response:', err.response);
  }
}

run();

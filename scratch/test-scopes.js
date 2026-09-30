require('dotenv').config({ path: '.env.local' });
const { Client, Databases, Users, Storage, Query, ID, Permission, Role } = require('node-appwrite');

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const users = new Users(client);

async function testAll() {
  console.log('1. Testing databases.listDocuments (tenants)...');
  try {
    const res = await databases.listDocuments(databaseId, 'tenants');
    console.log('✅ listDocuments success. Total:', res.total);
  } catch (e) {
    console.error('❌ listDocuments failed:', e.message, e.code, e.type);
  }

  console.log('2. Testing databases.createDocument (tenants)...');
  let testDocId = ID.unique();
  try {
    const doc = await databases.createDocument(
      databaseId,
      'tenants',
      testDocId,
      {
        name: 'Empresa Teste Escopo',
        companyName: 'Empresa Teste Escopo LTDA',
        personType: 'pj',
        document: '44555666000177',
        email: 'admin@escopo.com',
        phone: '11988887777',
        plan: 'pro',
        status: 'active',
        maxUsers: 5,
        ownerName: 'Gestor Teste',
        ownerEmail: 'admin@escopo.com',
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ]
    );
    console.log('✅ createDocument (tenants) success:', doc.$id);
  } catch (e) {
    console.error('❌ createDocument (tenants) failed:', e.message, e.code, e.type);
  }

  console.log('3. Testing users.create...');
  let testUserId = ID.unique();
  try {
    const user = await users.create(
      testUserId,
      'admin_test_scope@escopo.com',
      undefined,
      'Zap@2026!test',
      'Gestor Teste'
    );
    console.log('✅ users.create success:', user.$id);
  } catch (e) {
    console.error('❌ users.create failed:', e.message, e.code, e.type);
  }

  console.log('4. Testing databases.createDocument (users)...');
  let testUserDocId = ID.unique();
  try {
    const userDoc = await databases.createDocument(
      databaseId,
      'users',
      testUserDocId,
      {
        userId: testUserId,
        tenantId: testDocId,
        name: 'Gestor Teste',
        email: 'admin_test_scope@escopo.com',
        phone: '11988887777',
        role: 'owner',
        active: true,
        permissionsJson: JSON.stringify({ canManageAppointments: true }),
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ]
    );
    console.log('✅ createDocument (users) success:', userDoc.$id);
  } catch (e) {
    console.error('❌ createDocument (users) failed:', e.message, e.code, e.type);
  }

  console.log('5. Testing databases.createDocument (audit_logs)...');
  let testAuditId = ID.unique();
  try {
    const auditDoc = await databases.createDocument(
      databaseId,
      'audit_logs',
      testAuditId,
      {
        tenantId: testDocId,
        userId: testUserId,
        userName: 'Gestor Teste',
        userEmail: 'admin_test_scope@escopo.com',
        userRole: 'owner',
        action: 'super_admin.tenant_create',
        category: 'super_admin',
        entityId: testDocId,
        entityName: 'Empresa Teste Escopo',
        details: 'Teste de auditoria',
        ipAddress: '127.0.0.1',
        created_at: new Date().toISOString(),
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ]
    );
    console.log('✅ createDocument (audit_logs) success:', auditDoc.$id);
  } catch (e) {
    console.error('❌ createDocument (audit_logs) failed:', e.message, e.code, e.type);
  }

  // Cleanup
  try {
    await databases.deleteDocument(databaseId, 'audit_logs', testAuditId);
    await databases.deleteDocument(databaseId, 'users', testUserDocId);
    await users.delete(testUserId);
    await databases.deleteDocument(databaseId, 'tenants', testDocId);
    console.log('🧹 All test entities cleaned up successfully!');
  } catch (cleanErr) {
    console.warn('⚠️ Cleanup warning:', cleanErr.message);
  }
}

testAll();

import { Client, Databases, Users, Query, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

const COLLECTION_TENANTS = process.env.APPWRITE_COLLECTION_TENANTS || 'tenants';
const COLLECTION_USERS = process.env.APPWRITE_COLLECTION_USERS || 'users';

const DEFAULT_PERMISSIONS_JSON = JSON.stringify({
  canManageAppointments: true,
  canManageWorkOrders: true,
  canManageInvoices: true,
  canManageWhatsApp: true,
  canManageServices: true,
  canManageClients: true,
  canManageFiscal: true,
  canViewReports: true,
  canManageTeam: true,
});

async function main() {
  console.log('🚀 [ServiceZap] Iniciando sincronização completa de Auth & Database no Appwrite...');
  console.log(`📌 Project ID: ${projectId || 'não definido'} | Endpoint: ${endpoint}`);

  if (!projectId || !apiKey) {
    console.error('❌ ERRO: NEXT_PUBLIC_APPWRITE_PROJECT_ID ou APPWRITE_API_KEY não configurados no .env.local');
    process.exit(1);
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);
  const users = new Users(client);

  // 1. Cadastrar/Sincronizar Super Admin Master
  const superAdminEmail = 'flavio.santiago.ti@outlook.com';
  const superAdminPass = process.env.SUPERADMIN_PASSWORD || 'Favuca#1970';
  const superAdminName = 'Flavio Santiago (Super Admin)';

  console.log(`\n👑 Cadastrando/Verificando Super Admin Master (${superAdminEmail})...`);

  let masterAuthUserId = 'usr_master';
  try {
    const existingUsers = await users.list([Query.equal('email', superAdminEmail)]);
    if (existingUsers.users.length > 0) {
      masterAuthUserId = existingUsers.users[0].$id;
      // Atualiza senha se necessário
      await users.updatePassword(masterAuthUserId, superAdminPass);
      console.log(`✅ Conta Auth de Super Admin encontrada e senha atualizada (${superAdminEmail}).`);
    } else {
      const createdAuthUser = await users.create(
        ID.unique(),
        superAdminEmail,
        undefined,
        superAdminPass,
        superAdminName
      );
      masterAuthUserId = createdAuthUser.$id;
      console.log(`✨ Nova conta Auth criada com sucesso para o Super Admin (${superAdminEmail})!`);
    }
  } catch (authErr: any) {
    console.warn('⚠️ Erro/Aviso na Auth do Super Admin:', authErr?.message || authErr);
  }

  // Registra documento no Database
  try {
    const existingUserDoc = await databases.listDocuments(databaseId, COLLECTION_USERS, [
      Query.equal('email', superAdminEmail),
    ]);

    if (existingUserDoc.documents.length > 0) {
      await databases.updateDocument(databaseId, COLLECTION_USERS, existingUserDoc.documents[0].$id, {
        userId: masterAuthUserId,
        role: 'super_admin',
        name: superAdminName,
        active: true,
        permissionsJson: DEFAULT_PERMISSIONS_JSON,
      });
      console.log('✅ Documento de Super Admin atualizado na coleção `users`.');
    } else {
      await databases.createDocument(databaseId, COLLECTION_USERS, ID.unique(), {
        userId: masterAuthUserId,
        tenantId: 'tenant_master',
        name: superAdminName,
        email: superAdminEmail,
        role: 'super_admin',
        active: true,
        permissionsJson: DEFAULT_PERMISSIONS_JSON,
      });
      console.log('✨ Documento de Super Admin criado na coleção `users`.');
    }
  } catch (dbErr: any) {
    console.warn('⚠️ Erro/Aviso no Banco de Dados para Super Admin:', dbErr?.message || dbErr);
  }

  // 2. Cadastrar Admin da Empresa Alpha (tenant_01)
  const alphaEmail = 'alpha@servicezap.com';
  const alphaPass = 'Alpha@2026!';
  console.log(`\n🏢 Cadastrando/Verificando Admin Alpha (${alphaEmail})...`);
  try {
    const existingAlpha = await users.list([Query.equal('email', alphaEmail)]);
    let alphaAuthId = 'usr_alpha_owner';
    if (existingAlpha.users.length > 0) {
      alphaAuthId = existingAlpha.users[0].$id;
      await users.updatePassword(alphaAuthId, alphaPass);
    } else {
      const created = await users.create(ID.unique(), alphaEmail, undefined, alphaPass, 'Roberto Albuquerque (Alpha)');
      alphaAuthId = created.$id;
    }
    console.log(`✅ Admin Alpha pronto na Auth!`);
  } catch (e: any) {
    console.warn('Aviso Admin Alpha Auth:', e?.message);
  }

  // 3. Cadastrar Admin da Empresa Beta (tenant_02)
  const betaEmail = 'beta@servicezap.com';
  const betaPass = 'Beta@2026!';
  console.log(`\n🏢 Cadastrando/Verificando Admin Beta (${betaEmail})...`);
  try {
    const existingBeta = await users.list([Query.equal('email', betaEmail)]);
    let betaAuthId = 'usr_beta_owner';
    if (existingBeta.users.length > 0) {
      betaAuthId = existingBeta.users[0].$id;
      await users.updatePassword(betaAuthId, betaPass);
    } else {
      const created = await users.create(ID.unique(), betaEmail, undefined, betaPass, 'Carlos Mendes (Beta)');
      betaAuthId = created.$id;
    }
    console.log(`✅ Admin Beta pronto na Auth!`);
  } catch (e: any) {
    console.warn('Aviso Admin Beta Auth:', e?.message);
  }

  console.log('\n🎉 Sincronização concluída com sucesso!');
  console.log(`👑 Super Admin Master: ${superAdminEmail} | Senha: ${superAdminPass}`);
  console.log(`🏢 Admin Alpha: ${alphaEmail} | Senha: ${alphaPass}`);
  console.log(`🏢 Admin Beta: ${betaEmail} | Senha: ${betaPass}`);
}

main().catch((err) => {
  console.error('❌ Erro fatal no script:', err);
  process.exit(1);
});

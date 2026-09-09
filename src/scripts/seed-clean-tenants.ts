import { Client, Databases, Query, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

const COLLECTION_TENANTS = process.env.APPWRITE_COLLECTION_TENANTS || 'tenants';
const COLLECTION_USERS = process.env.APPWRITE_COLLECTION_USERS || 'users';
const COLLECTION_SERVICES = process.env.APPWRITE_COLLECTION_SERVICES || 'services';
const COLLECTION_CLIENTS = process.env.APPWRITE_COLLECTION_CLIENTS || 'clients';

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
  console.log('🏢 [ServiceZap] Criando empresas fictícias e usuários com isolamento Multi-Tenant...');

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  // 1. Limpa tenants e usuários antigos do banco para recriação limpa
  try {
    const existingTenants = await databases.listDocuments(databaseId, COLLECTION_TENANTS, [Query.limit(100)]);
    for (const doc of existingTenants.documents) {
      await databases.deleteDocument(databaseId, COLLECTION_TENANTS, doc.$id);
    }
    const existingUsers = await databases.listDocuments(databaseId, COLLECTION_USERS, [Query.limit(100)]);
    for (const doc of existingUsers.documents) {
      await databases.deleteDocument(databaseId, COLLECTION_USERS, doc.$id);
    }
    console.log('🧹 Tenants e usuários antigos limpos com sucesso.');
  } catch (err: any) {
    console.warn('Aviso na limpeza:', err?.message);
  }

  // 2. Cria Empresa 1: Alpha Climatização (tenant_01)
  console.log('\n🔵 Criando Empresa 1: Alpha Climatização & Elétrica (tenant_01)...');
  await databases.createDocument(
    databaseId,
    COLLECTION_TENANTS,
    'tenant_01',
    {
      name: 'Alpha Climatização & Elétrica',
      companyName: 'Alpha Climatização e Soluções Térmicas Ltda',
      document: '11.222.333/0001-44',
      email: 'contato@alphaclima.com.br',
      phone: '11988881111',
      plan: 'pro',
      status: 'active',
      personType: 'pj',
      maxUsers: 5,
      ownerName: 'Roberto Albuquerque',
      ownerEmail: 'roberto@alphaclima.com.br',
      pixKey: '11222333000144',
      pixKeyType: 'cnpj',
      taxRegime: 'simples_nacional',
      municipalRegistration: '123456-0',
      issRate: 2.0,
    }
  );

  await databases.createDocument(
    databaseId,
    COLLECTION_USERS,
    ID.unique(),
    {
      userId: 'usr_alpha_owner',
      tenantId: 'tenant_01',
      name: 'Roberto Albuquerque (Alpha)',
      email: 'alpha@servicezap.com',
      phone: '11988881111',
      role: 'owner',
      permissionsJson: DEFAULT_PERMISSIONS_JSON,
      active: true,
    }
  );

  // Serviços e Clientes da Empresa Alpha (tenant_01)
  await databases.createDocument(databaseId, COLLECTION_SERVICES, ID.unique(), {
    tenantId: 'tenant_01',
    name: 'Instalação de Ar Condicionado Split',
    description: 'Instalação completa com suporte, tubulação de cobre e teste de vácuo',
    price: 450.00,
    durationMinutes: 120,
    category: 'Climatização',
    unit: 'serviço',
    active: true,
  });

  await databases.createDocument(databaseId, COLLECTION_SERVICES, ID.unique(), {
    tenantId: 'tenant_01',
    name: 'Higienização e Manutenção Preventiva',
    description: 'Limpeza química de serpentinas, turbinas e filtros com bactericida',
    price: 180.00,
    durationMinutes: 60,
    category: 'Manutenção',
    unit: 'un',
    active: true,
  });

  await databases.createDocument(databaseId, COLLECTION_CLIENTS, ID.unique(), {
    tenantId: 'tenant_01',
    name: 'Condomínio Solar das Flores',
    document: '22.111.000/0001-99',
    email: 'sindico@solardasflores.com.br',
    phone: '11991234567',
    status: 'active',
    address: 'Av. Paulista, 1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  });

  console.log('✅ Empresa 1 (Alpha) criada com sucesso!');

  // 3. Cria Empresa 2: Beta Hidráulica (tenant_02)
  console.log('\n🟢 Criando Empresa 2: Beta Hidráulica & Desentupidora (tenant_02)...');
  await databases.createDocument(
    databaseId,
    COLLECTION_TENANTS,
    'tenant_02',
    {
      name: 'Beta Hidráulica & Desentupidora',
      companyName: 'Beta Soluções Hidráulicas e Desentupimentos Ltda',
      document: '22.333.444/0001-55',
      email: 'contato@betahidro.com.br',
      phone: '11977772222',
      plan: 'starter',
      status: 'active',
      personType: 'pj',
      maxUsers: 3,
      ownerName: 'Mariana Costa',
      ownerEmail: 'mariana@betahidro.com.br',
      pixKey: '22333444000155',
      pixKeyType: 'cnpj',
      taxRegime: 'simples_nacional',
      municipalRegistration: '654321-0',
      issRate: 2.0,
    }
  );

  await databases.createDocument(
    databaseId,
    COLLECTION_USERS,
    ID.unique(),
    {
      userId: 'usr_beta_owner',
      tenantId: 'tenant_02',
      name: 'Mariana Costa (Beta)',
      email: 'beta@servicezap.com',
      phone: '11977772222',
      role: 'owner',
      permissionsJson: DEFAULT_PERMISSIONS_JSON,
      active: true,
    }
  );

  // Serviços e Clientes da Empresa Beta (tenant_02)
  await databases.createDocument(databaseId, COLLECTION_SERVICES, ID.unique(), {
    tenantId: 'tenant_02',
    name: 'Caça Vazamento Eletrônico com Geofone',
    description: 'Localização de vazamentos ocultos por ultrassom sem quebra-quebra',
    price: 350.00,
    durationMinutes: 90,
    category: 'Detecção',
    unit: 'ponto',
    active: true,
  });

  await databases.createDocument(databaseId, COLLECTION_SERVICES, ID.unique(), {
    tenantId: 'tenant_02',
    name: 'Desentupimento de Rede de Esgoto',
    description: 'Desobstrução com máquina rotativa R-600',
    price: 280.00,
    durationMinutes: 60,
    category: 'Desentupimento',
    unit: 'metro',
    active: true,
  });

  await databases.createDocument(databaseId, COLLECTION_CLIENTS, ID.unique(), {
    tenantId: 'tenant_02',
    name: 'Restaurante Sabor & Arte',
    document: '33.444.555/0001-88',
    email: 'financeiro@saborearte.com.br',
    phone: '11987654321',
    status: 'active',
    address: 'Rua Oscar Freire, 500',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
  });

  console.log('✅ Empresa 2 (Beta) criada com sucesso!');

  console.log('\n🎉 [SETUP MULTI-TENANT CONCLUÍDO]');
  console.log('------------------------------------------------------------');
  console.log('🏢 Empresa Alpha: alpha@servicezap.com (tenant_01)');
  console.log('🏢 Empresa Beta:  beta@servicezap.com  (tenant_02)');
  console.log('👑 Super Admin:   master@servicezap.com (tenant_master)');
  console.log('------------------------------------------------------------');
}

main().catch(console.error);

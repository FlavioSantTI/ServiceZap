import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { SAAS_PLANS } from '../lib/constants/plans';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';

if (!projectId || !apiKey) {
  console.error('❌ Erro: variáveis não encontradas');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function fixSaasPlans() {
  console.log('🚀 Ajustando coleção saas_plans no Appwrite...');

  // 1. Detectar DB
  let targetDbId = databaseId;
  const existingDbs = await databases.list();
  if (existingDbs.databases.length > 0) {
    const found = existingDbs.databases.find(db => db.$id.toLowerCase() === databaseId.toLowerCase());
    targetDbId = found ? found.$id : existingDbs.databases[0].$id;
  }

  // 2. Tenta deletar a coleção saas_plans se ela foi criada incompleta
  try {
    await databases.deleteCollection(targetDbId, 'saas_plans');
    console.log('🗑️ Coleção saas_plans anterior removida para recriação limpa.');
    // Pequena pausa para o Appwrite processar a deleção
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
    // Não existia
  }

  // 3. Criar a coleção saas_plans
  console.log('🔨 Criando coleção saas_plans...');
  await databases.createCollection(targetDbId, 'saas_plans', 'Planos SaaS');

  // 4. Criar atributos com tamanhos otimizados
  console.log('📐 Criando atributos compactos...');
  await databases.createStringAttribute(targetDbId, 'saas_plans', 'planId', 50, true);
  await databases.createStringAttribute(targetDbId, 'saas_plans', 'name', 100, true);
  await databases.createStringAttribute(targetDbId, 'saas_plans', 'badge', 50, false);
  await databases.createStringAttribute(targetDbId, 'saas_plans', 'description', 500, false);
  await databases.createBooleanAttribute(targetDbId, 'saas_plans', 'popular', false, false);
  await databases.createFloatAttribute(targetDbId, 'saas_plans', 'priceMonthly', true);
  await databases.createFloatAttribute(targetDbId, 'saas_plans', 'priceYearly', false);
  await databases.createStringAttribute(targetDbId, 'saas_plans', 'limitsJson', 1000, false);
  await databases.createStringAttribute(targetDbId, 'saas_plans', 'featuresJson', 1000, false);
  await databases.createStringAttribute(targetDbId, 'saas_plans', 'featureListJson', 1500, false);

  console.log('⏳ Aguardando indexação dos atributos no Appwrite (5s)...');
  await new Promise(r => setTimeout(r, 5000));

  // 5. Popular com os planos padrão
  console.log('🌱 Populando planos padrão no banco...');
  for (const plan of Object.values(SAAS_PLANS)) {
    try {
      await databases.createDocument(targetDbId, 'saas_plans', plan.id, {
        planId: plan.id,
        name: plan.name,
        badge: plan.badge || '',
        description: plan.description || '',
        popular: !!plan.popular,
        priceMonthly: Number(plan.priceMonthly) || 0,
        priceYearly: Number(plan.priceYearly) || 0,
        limitsJson: JSON.stringify(plan.limits || {}),
        featuresJson: JSON.stringify(plan.features || {}),
        featureListJson: JSON.stringify(plan.featureList || []),
      });
      console.log(`  ✓ Plano ${plan.name} (${plan.id}) inserido com sucesso!`);
    } catch (err: any) {
      console.warn(`  ⚠️ Aviso ao inserir plano ${plan.id}:`, err?.message);
    }
  }

  console.log('✨ Configuração de saas_plans concluída com sucesso!');
}

fixSaasPlans().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});

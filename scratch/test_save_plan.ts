import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { saveSaasPlanAction, fetchSaasPlansAction } from '../src/app/actions/super-admin';

async function testSave() {
  console.log('--- Testando fetchSaasPlansAction ---');
  const before = await fetchSaasPlansAction();
  console.log('Antes:', before.map(p => ({ id: p.id, name: p.name, priceMonthly: p.priceMonthly })));

  const testPlan = {
    id: 'starter',
    name: 'Starter (Solo) Editado',
    badge: 'Popular',
    description: 'Descrição de teste para salvar no Appwrite',
    popular: true,
    priceMonthly: 59.90,
    priceYearly: 590.00,
    limits: {
      maxUsers: 2,
      maxAppointmentsPerMonth: Infinity,
      maxWorkOrdersPerMonth: Infinity,
      maxClients: 500,
      maxWhatsAppInstances: 1,
    },
    features: {
      hasNfe: false,
      hasWhatsAppBroadcast: false,
      hasAuditLogs: false,
      hasCustomPdfBranding: true,
      hasMultipleAttendants: false,
      hasFinancialReports: true,
      hasApiAccess: false,
    },
    featureList: ['Feature 1', 'Feature 2'],
  };

  console.log('--- Executando saveSaasPlanAction ---');
  const res = await saveSaasPlanAction(testPlan);
  console.log('Resultado de saveSaasPlanAction:', res);

  console.log('--- Buscando novamente com fetchSaasPlansAction ---');
  const after = await fetchSaasPlansAction();
  console.log('Depois:', after.map(p => ({ id: p.id, name: p.name, priceMonthly: p.priceMonthly })));
}

testSave().catch(console.error);

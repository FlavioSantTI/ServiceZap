import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { saveSaasPlanAction } from '../src/app/actions/super-admin';
import { SAAS_PLANS } from '../src/lib/constants/plans';

async function restore() {
  await saveSaasPlanAction(SAAS_PLANS.starter);
  console.log('Starter plan restaurado ao padrão.');
}

restore().catch(console.error);

import { SAAS_PLANS, PlanDefinition, getPlanDetails } from '@/lib/constants/plans';
import { TenantDocument } from '@/types/appwrite';

export interface PlanLimitCheckResult {
  allowed: boolean;
  currentCount?: number;
  limit?: number;
  message?: string;
  upgradeRequired?: boolean;
}

/**
 * Verifica se um recurso booleano está habilitado no plano do Tenant.
 */
export function hasFeatureAccess(
  tenantPlan: string | undefined,
  feature: keyof PlanDefinition['features']
): boolean {
  const plan = getPlanDetails(tenantPlan);
  return !!plan.features[feature];
}

/**
 * Verifica se o Tenant atingiu o limite de um recurso numérico no seu plano.
 */
export function checkResourceLimit(
  tenantPlan: string | undefined,
  resource: keyof PlanDefinition['limits'],
  currentCount: number
): PlanLimitCheckResult {
  const plan = getPlanDetails(tenantPlan);
  const limit = plan.limits[resource];

  if (limit === Infinity || currentCount < limit) {
    return {
      allowed: true,
      currentCount,
      limit,
    };
  }

  return {
    allowed: false,
    currentCount,
    limit,
    upgradeRequired: true,
    message: `Você atingiu o limite de ${limit} ${resource} no plano ${plan.name}. Faça upgrade para continuar!`,
  };
}

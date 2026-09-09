import { getCurrentUserAction } from '@/app/actions/auth';

/**
 * Resolve o tenantId da sessão autenticada.
 * Se não houver sessão ou tenant configurado, faz fallback para 'tenant_01'.
 */
export async function getTenantId(): Promise<string> {
  const session = await getCurrentUserAction();
  return session?.tenantId || 'tenant_01';
}

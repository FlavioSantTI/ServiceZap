import { Permission, Role } from 'node-appwrite';

/**
 * Permissões padrão para novos documentos criados via Admin API Key.
 * O Appwrite exige que todo createDocument tenha permissões explícitas,
 * caso contrário retorna "No permissions provided for action 'create'".
 */
export const DEFAULT_DOC_PERMISSIONS = [
  Permission.read(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

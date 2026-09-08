'use server';

import { createAdminClient, createSessionClient } from '@/lib/appwrite/server';
import { UserDocument, UserRole, DEFAULT_ADMIN_PERMISSIONS } from '@/types/appwrite';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Query } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_USERS = process.env.APPWRITE_COLLECTION_USERS || 'users';

export interface CurrentUserSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  permissions?: any;
}

export async function getCurrentUserAction(): Promise<CurrentUserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('appwrite-session');

    // Se estiver em modo mock (sem envs ou sem sessão real)
    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || !sessionCookie) {
      // Mock do usuário logado (Admin do Tenant 01)
      return {
        userId: 'usr_01',
        name: 'Flavio Dias',
        email: 'flavio@servicezap.com',
        role: 'owner',
        tenantId: 'tenant_01',
        permissions: DEFAULT_ADMIN_PERMISSIONS,
      };
    }

    const { account } = await createSessionClient();
    const authUser = await account.get();

    // Busca detalhes do usuário na coleção `users`
    const { databases } = await createAdminClient();
    const userDocs = await databases.listDocuments(DATABASE_ID, COLLECTION_USERS, [
      Query.equal('userId', authUser.$id),
      Query.limit(1),
    ]);

    if (userDocs.documents.length > 0) {
      const userProfile: any = userDocs.documents[0];
      let permissions = userProfile.permissions;
      if (!permissions && userProfile.permissionsJson) {
        try {
          permissions = JSON.parse(userProfile.permissionsJson);
        } catch (e) {
          permissions = DEFAULT_ADMIN_PERMISSIONS;
        }
      }

      return {
        userId: authUser.$id,
        name: userProfile.name || authUser.name,
        email: userProfile.email || authUser.email,
        role: (userProfile.role as UserRole) || 'user',
        tenantId: userProfile.tenantId || 'tenant_01',
        permissions: permissions || DEFAULT_ADMIN_PERMISSIONS,
      };
    }

    return {
      userId: authUser.$id,
      name: authUser.name,
      email: authUser.email,
      role: 'owner',
      tenantId: 'tenant_01',
      permissions: DEFAULT_ADMIN_PERMISSIONS,
    };
  } catch (error) {
    return {
      userId: 'usr_01',
      name: 'Flavio Dias',
      email: 'flavio@servicezap.com',
      role: 'owner',
      tenantId: 'tenant_01',
      permissions: DEFAULT_ADMIN_PERMISSIONS,
    };
  }
}

export async function logoutAction(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('appwrite-session');
  } catch (error) {
    console.error('Erro no logout:', error);
  }
  redirect('/login');
}

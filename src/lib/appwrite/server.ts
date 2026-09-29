import { Client, Databases, Account, Users, Storage, Permission, Role } from 'node-appwrite';
import { cookies } from 'next/headers';

export const DEFAULT_DOC_PERMISSIONS = [
  Permission.read(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

function wrapDatabases(databases: Databases): Databases {
  return new Proxy(databases, {
    get(target, prop, receiver) {
      if (prop === 'createDocument') {
        return (
          databaseId: string,
          collectionId: string,
          documentId: string,
          data: any,
          permissions?: string[]
        ) => {
          const finalPermissions =
            permissions && permissions.length > 0 ? permissions : DEFAULT_DOC_PERMISSIONS;
          return target.createDocument(
            databaseId,
            collectionId,
            documentId,
            data,
            finalPermissions
          );
        };
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    },
  });
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return wrapDatabases(new Databases(client));
    },
    get users() {
      return new Users(client);
    },
    get storage() {
      return new Storage(client);
    },
  };
}

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

  const cookieStore = await cookies();
  const session = cookieStore.get('appwrite-session');

  if (session && session.value) {
    client.setSession(session.value);
  }

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return wrapDatabases(new Databases(client));
    },
  };
}

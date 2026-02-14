import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function hasRole(targetRoles: string[]) {
  const session = await getSession();
  return hasRoleInSession(session, targetRoles);
}

export function hasRoleInSession(session: any, targetRoles: string[]) {
  if (targetRoles.length === 0) {
    return true;
  }
  // Better Auth session structure: session.user.roles (if custom field added)
  // Or session.user.role if standard.
  // My auth.ts config has additionalFields: { roles: { type: "string" } }
  if (targetRoles.includes(session?.user?.roles)) {
    return true;
  }
  return false;
}

export async function checkAccess(targetRole: string, failedPath: string) {
  const session = await getSession();
  if (!session) {
    redirect(failedPath);
  }
  if (targetRole !== '' && session?.user?.roles !== targetRole) {
    redirect(failedPath);
  }
}

export async function getSession() {
  return await auth.api.getSession({
    headers: await headers()
  });
}

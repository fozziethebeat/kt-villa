import {redirect} from 'next/navigation';

import {auth} from '@/lib/auth';

export async function hasRole(targetRoles: string[]) {
  const session = await auth();
  return hasRoleInSession(session, targetRoles);
}

export function hasRoleInSession(session, targetRoles: string[]) {
  if (targetRoles.length === 0) {
    return true;
  }
  if (targetRoles.includes(session?.user?.roles)) {
    return true;
  }
  return false;
}

export async function checkAccess(targetRole: string, failedPath: string) {
  const session = await auth();
  if (!session) {
    redirect(failedPath);
  }
  if (targetRole !== '' && session?.user?.roles !== targetRole) {
    redirect(failedPath);
  }
}

export async function getSession() {
  return await auth();
}

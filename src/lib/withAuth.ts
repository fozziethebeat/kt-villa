import {checkAccess, getSession} from './auth-check';

export function withAuth<T>(
  Component: React.ComponentType<T>,
  targetRole: string,
  failedPath: string,
): React.ComponentType<T> {
  return async function ProtectedPage(props: T) {
    await checkAccess(targetRole, failedPath);
    return Component;
  };
}

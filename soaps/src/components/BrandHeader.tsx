import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasRoleInSession } from '@/lib/auth-check';
import { BrandHeaderShell } from './BrandHeaderShell';

interface BrandHeaderProps {
  transparent?: boolean;
}

export async function BrandHeader({ transparent = false }: BrandHeaderProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAdmin = hasRoleInSession(session, ['admin']);

  return (
    <BrandHeaderShell
      transparent={transparent}
      isAdmin={isAdmin}
      userName={session?.user?.name}
      isSignedIn={Boolean(session?.user)}
    />
  );
}

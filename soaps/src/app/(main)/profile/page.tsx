import { BrandHeader } from '@/components/BrandHeader';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <BrandHeader />

      <main className="flex-1 mx-auto w-full max-w-[680px] px-6 md:px-12 pt-28 pb-24">
        <div className="mb-10">
          <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-foreground">
            Account
          </h1>
          <p className="mt-2 text-[1rem] text-muted-foreground">
            Manage your profile details.
          </p>
        </div>

        <div className="border-t border-border pt-8">
          <ProfileForm user={user} />
        </div>
      </main>
    </div>
  );
}

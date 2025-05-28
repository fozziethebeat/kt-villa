import Link from 'next/link';

import {auth} from '@/lib/auth';
import {DreamThemeGrid} from '@/components/DreamThemeGrid';
import {ProjectGrid} from '@/components/ProjectGrid';
import {UsernameCard} from '@/components/UsernameCard';
import {Header} from '@/components/Header';
import {Button} from '@/components/ui/button';
import {SidebarTrigger} from '@/components/ui/sidebar';

export default async function Home() {
  const session = await auth();
  return (
    <>
      <Header target="Home" links={[]} />
      <div className="flex flex-col gap-4 py-4 px-4">
        {session?.user ? (
          <div className="flex flex-col gap-2">
            <UsernameCard />

            <ProjectGrid />

            <div className="divider">Your Dreams</div>
            <DreamThemeGrid />
            <img
              className="rounded"
              src="/yumegai_banner_5.png"
              width="1024"
              height="512"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/signin">Start Dreaming</Link>
            </Button>
            <img
              src="/yumegai_banner_5.png"
              width="1024"
              height="512"
              className="rounded"
            />
          </div>
        )}
      </div>
    </>
  );
}

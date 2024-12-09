import Link from 'next/link';

import {auth} from '@/lib/auth';
import {Header} from '@/components/Header';
import {Button} from '@/components/ui/button';
import {SidebarTrigger} from '@/components/ui/sidebar';

export default async function Home() {
  const session = await auth();
  return (
    <>
      <Header target="Home" />
      <div className="flex flex-col gap-4 py-4 px-4">
        {session?.user ? (
          <div>
            <img src="/yumegai_banner.png" width="1024" height="512" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/signin">Signin</Link>
            </Button>
            <img src="/yumegai_banner.png" width="1024" height="512" />
          </div>
        )}
      </div>
    </>
  );
}

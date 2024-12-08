import {auth} from '@/lib/auth';

import {Header} from '@/components/Header';
import {SidebarTrigger} from '@/components/ui/sidebar';

export default async function Home() {
  const session = await auth();
  return (
    <>
      <Header target="Home" />
      <div className="flex flex-col gap-4 py-4 px-4">
        {session?.user ? <div>Magic</div> : <div>Signup</div>}
      </div>
    </>
  );
}

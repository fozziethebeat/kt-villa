import {auth} from '@/lib/auth';

import {Header} from '@/components/Header';
import {StyleTable} from '@/components/StyleTable';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {SidebarTrigger} from '@/components/ui/sidebar';

export default async function Home() {
  const session = await auth();
  return (
    <>
      <Header target="Home" />
      <div className="flex flex-col gap-4 py-4 px-4">
        {session?.user ? <StyleTable /> : <div>Signup</div>}
      </div>
    </>
  );
}

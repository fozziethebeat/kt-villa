import {checkAccess} from '@/lib/auth-check';

import {Header} from '@/components/Header';
import {AdminDreamsTable} from '@/components/AdminDreamsTable';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

const links = [{url: '/', label: 'Home'}];
export default async function Home() {
  await checkAccess('admin', '/');
  return (
    <>
      <Header links={links} target="Admin" />
      <Tabs defaultValue="stuff" className="">
        <AdminDreamsTable />
      </Tabs>
    </>
  );
}

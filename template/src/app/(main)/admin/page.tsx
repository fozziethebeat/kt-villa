import { checkAccess } from '@/lib/auth-check';

import { Header } from '@/components/Header';

const links = [{ url: '/', label: 'Home' }];
export default async function Home() {
  await checkAccess('admin', '/');
  return (
    <>
      <Header links={links} target="Admin" />
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div>Yer an admin harry</div>
      </div>
    </>
  );
}

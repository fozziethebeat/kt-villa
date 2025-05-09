import {checkAccess} from '@/lib/auth-check';

import {Header} from '@/components/Header';

const links = [{url: '/', label: 'Home'}];
export default async function Home() {
  await checkAccess('admin', '/');
  return (
    <>
      <Header links={links} target="Admin" />
      <div>Yer an admin harry</div>
    </>
  );
}

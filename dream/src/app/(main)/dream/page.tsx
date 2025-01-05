import Link from 'next/link';

import {checkAccess} from '@/lib/auth-check';
import {DreamFlow} from '@/components/DreamFlow';
import {Header} from '@/components/Header';

const links = [{url: '/', label: 'Home'}];

export default async function Dream() {
  await checkAccess('', '/');
  return (
    <>
      <Header links={links} target="Dream" />
      <DreamFlow />
    </>
  );
}

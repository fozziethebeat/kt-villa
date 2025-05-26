import {auth} from '@/lib/auth';
import {Header} from '@/components/Header';

const links = [{url: '/', label: 'Home'}];

export default async function ProjectPage({params}) {
  const session = await auth();
  const {user, code} = await params;
  return (
    <>
      <Header target={code} links={links} />
      <div className="flex flex-col gap-4 py-4 px-4">
        <span>{user}</span>
        <span>{code}</span>
      </div>
    </>
  );
}

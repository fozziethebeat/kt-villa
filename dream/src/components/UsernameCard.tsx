import {auth} from '@/lib/auth';

import {UsernameForm} from '@/components/UsernameForm';
export async function UsernameCard() {
  const session = await auth();
  if (session?.user?.name) {
    return <></>;
  }
  return (
    <div className="card bg-base-100 w-96 h-128 shadow-xl">
      <div className="card-body">
        <UsernameForm />
      </div>
    </div>
  );
}

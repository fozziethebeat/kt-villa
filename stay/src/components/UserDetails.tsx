import {auth} from '@/lib/auth';

import {EditUserDetails} from '@/components/EditUserDetails';

export async function UserDetails() {
  const session = await auth();
  return (
    <div className="flex flex-row gap-2 p-4 w-96">
      <div className="avatar">
        <div className="w-10 rounded-full">
          <img src={session.user.profileImageUrl} />
        </div>
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <div className="truncate font-semibold">
          {session.user.name || 'unknown'}
        </div>
        <div className="truncate text-xs">{session.user.email}</div>
      </div>
      <EditUserDetails user={session.user} />
    </div>
  );
}

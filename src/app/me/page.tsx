import {checkAccess} from '@/lib/auth-check';

import {UserDetails} from '@/components/UserDetails';
import {MemberBookingsGrid} from '@/components/MemberBookingsGrid';
import {UserBookingsGrid} from '@/components/UserBookingsGrid';

export default async function MyPage() {
  await checkAccess('', '/');
  return (
    <div>
      <UserDetails />
      <UserBookingsGrid />
      <MemberBookingsGrid />
    </div>
  );
}

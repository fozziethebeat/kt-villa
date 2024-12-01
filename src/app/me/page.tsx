import {withAuth} from '@/lib/withAuth';

import {UserDetails} from '@/components/UserDetails';
import {MemberBookingsGrid} from '@/components/MemberBookingsGrid';
import {UserBookingsGrid} from '@/components/UserBookingsGrid';

function MyPage() {
  return (
    <div>
      <UserDetails />
      <UserBookingsGrid />
      <MemberBookingsGrid />
    </div>
  );
}

export default withAuth(MyPage, '', '/');

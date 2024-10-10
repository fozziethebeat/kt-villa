import { withAuth } from "@/lib/withAuth";

import { MemberBookingsGrid } from "@/components/MemberBookingsGrid";
import { UserBookingsGrid } from "@/components/UserBookingsGrid";

function MyPage() {
  return (
    <div>
      <UserBookingsGrid />
      <MemberBookingsGrid />
    </div>
  );
}

export default withAuth(MyPage, "", "/");

import { checkAccess } from "@/lib/auth-check";

import { UserDetails } from "@/components/UserDetails";
import { MemberBookingsGrid } from "@/components/MemberBookingsGrid";
import { UserBookingsGrid } from "@/components/UserBookingsGrid";

export default async function MyPage() {
  await checkAccess("", "/signin");
  return (
    <div className="alpine-container space-y-10 py-8 lg:py-12">
      <UserDetails />
      <UserBookingsGrid />
      <MemberBookingsGrid />
    </div>
  );
}

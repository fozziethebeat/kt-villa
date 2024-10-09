/*
 * Uses https://ui.shadcn.com/blocks instead of DaisyUI for clear role
 * difference.
 */
import { withAuth } from "@/lib/withAuth";

import { AdminBookingTable } from "@/components/AdminBookingTable";

async function AdminPage({ session }) {
  return (
    <div className="p-4">
      <AdminBookingTable />
    </div>
  );
}

export default withAuth(AdminPage, "admin", "/");

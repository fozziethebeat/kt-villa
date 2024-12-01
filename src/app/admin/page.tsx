/*
 * Uses https://ui.shadcn.com/blocks instead of DaisyUI for clear role
 * difference.
 */
import { withAuth } from "@/lib/withAuth";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AdminBookingTable } from "@/components/AdminBookingTable";
import { AdminAdapterTable } from "@/components/AdminAdapterTable";
import { AdminUsersTable } from "@/components/AdminUsersTable";

async function AdminPage({ session }) {
  return (
    <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Admin</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div role="tablist" className="tabs tabs-bordered w-full">
        <input
          type="radio"
          name="my_tabs_1"
          role="tab"
          className="tab"
          label="Bookings"
          aria-label="Bookings"
          defaultChecked
        />
        <div role="tabpanel" className="tab-content">
          <AdminBookingTable />
        </div>

        <input
          type="radio"
          name="my_tabs_1"
          role="tab"
          className="tab"
          label="Adapters"
          aria-label="Adapters"
        />
        <div role="tabpanel" className="tab-content">
          <AdminAdapterTable />
        </div>

        <input
          type="radio"
          name="my_tabs_1"
          role="tab"
          className="tab"
          label="Users"
          aria-label="Users"
        />
        <div role="tabpanel" className="tab-content">
          <AdminUsersTable />
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminPage, "admin", "/");

import {getSession} from '@/lib/auth-check';
import {withAuth} from '@/lib/withAuth';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {AdminBookingTable} from '@/components/AdminBookingTable';
import {AdminAdapterTable} from '@/components/AdminAdapterTable';
import {AdminUsersTable} from '@/components/AdminUsersTable';

async function AdminPage() {
  const session = await getSession();
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
          aria-label="Users"
        />
        <div role="tabpanel" className="tab-content">
          <AdminUsersTable />
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminPage, 'admin', '/');

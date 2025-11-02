import { getSession } from "@/lib/auth-check";
import { checkAccess } from "@/lib/auth-check";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppWindowIcon, CodeIcon } from "lucide-react";
import { AdminBookingTable } from "@/components/AdminBookingTable";
import { AdminAdapterTable } from "@/components/AdminAdapterTable";
import { AdminUsersTable } from "@/components/AdminUsersTable";

export default async function AdminPage({ searchParams }) {
  await checkAccess("admin", "/");
  const session = await getSession();
  const { view } = await searchParams;
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

      <Tabs defaultValue={view || "bookings"}>
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="adapters">Adapters</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings">
          <AdminBookingTable />
        </TabsContent>
        <TabsContent value="users">
          <AdminUsersTable />
        </TabsContent>
        <TabsContent value="adapters">
          <AdminAdapterTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

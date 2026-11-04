import { Calendar, Palette, ShieldCheck, Users } from "lucide-react";

import { checkAccess } from "@/lib/auth-check";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminBookingTable } from "@/components/AdminBookingTable";
import { AdminAdapterTable } from "@/components/AdminAdapterTable";
import { AdminUsersTable } from "@/components/AdminUsersTable";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await checkAccess("admin", "/");
  const { view } = await searchParams;

  return (
    <div className="alpine-container space-y-8 py-8 lg:py-12">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <ShieldCheck className="h-4 w-4" />
            KT Villa Management
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
            Admin Console
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve or override stays, manage guest trust &amp; roles, and curate
            seasonal AI art adapters.
          </p>
        </div>
      </div>

      <Tabs defaultValue={view || "bookings"} className="space-y-6">
        <TabsList className="inline-flex h-11 items-center gap-1 rounded-xl border border-border bg-card p-1">
          <TabsTrigger
            value="bookings"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Calendar className="h-3.5 w-3.5" />
            Bookings
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Users className="h-3.5 w-3.5" />
            Guest Directory
          </TabsTrigger>
          <TabsTrigger
            value="adapters"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Palette className="h-3.5 w-3.5" />
            AI Art Adapters
          </TabsTrigger>
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

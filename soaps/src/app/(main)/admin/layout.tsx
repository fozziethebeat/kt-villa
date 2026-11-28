import { checkAccess } from "@/lib/auth-check";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await checkAccess('admin', '/');

    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <div className="flex flex-col flex-1 min-h-screen w-full bg-background">
                {children}
            </div>
        </SidebarProvider>
    );
}

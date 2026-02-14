import { checkAccess } from "@/lib/auth-check";


export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ### Admin Image Generation UI
    // -   **New Route**: Created `/admin/image-gen` (located in `src/app/(main)/admin/image-gen`) which is protected by a server-side role check.
    // -   **Tester UI**: A clean, responsive interface to input text prompts and view generated images.
    // -   **Role-Based Access**: Added a nested `/admin` layout that redirects non-admin users to ensure security and inherits the `SidebarProvider`.
    await checkAccess('admin', '/');

    return (
        <div className="flex flex-col flex-1 h-full">

            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}

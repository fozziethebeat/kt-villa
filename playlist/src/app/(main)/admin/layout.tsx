import { checkAccess } from "@/lib/auth-check";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await checkAccess('admin', '/');

    return (
        <div className="flex flex-col flex-1 h-full">
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}

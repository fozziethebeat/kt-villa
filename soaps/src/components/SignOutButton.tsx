"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/signin");
                },
            },
        });
    };

    return (
        <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
            <LogOut />
            <span>Sign out</span>
        </SidebarMenuButton>
    );
}

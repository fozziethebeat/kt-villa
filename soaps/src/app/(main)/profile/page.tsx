import { Header } from "@/components/Header"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { ProfileForm } from "./ProfileForm"

export default async function ProfilePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        redirect("/api/auth/signin")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!user) {
        redirect("/api/auth/signin")
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header links={[{ label: "Home", url: "/" }]} target="Profile" />

            <main className="flex-1 container max-w-2xl mx-auto py-12 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">Your Profile</h1>
                    <p className="text-brand-stone mt-2">Manage your account settings and preferences.</p>
                </div>

                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                        <ProfileForm user={user} />
                    </div>
                </div>
            </main>
        </div>
    )
}

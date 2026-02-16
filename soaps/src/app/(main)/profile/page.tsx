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
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            <Header links={[{ label: "Home", url: "/" }]} target="Profile" />

            <main className="flex-1 container max-w-2xl mx-auto py-12 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Profile</h1>
                    <p className="text-slate-500 mt-2">Manage your account settings and preferences.</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                        <ProfileForm user={user} />
                    </div>
                </div>
            </main>
        </div>
    )
}

import prisma from '@/lib/prisma'
import { Header } from '@/components/Header'
import { JoinCodeDashboard } from './JoinCodeDashboard'

const links = [
    { url: '/', label: 'Home' },
    { url: '/admin', label: 'Admin' },
]

export default async function JoinCodesPage() {
    const codes = await prisma.magicCode.findMany({
        where: { type: 'JOIN' },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            label: true,
            active: true,
            createdAt: true,
        },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Serialize dates for client component
    const serializedCodes = codes.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
    }))

    return (
        <>
            <Header links={links} target="Join Codes" />
            <div className="container mx-auto py-10 px-4 md:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">
                        Join Codes
                    </h1>
                    <p className="text-brand-stone mt-2">
                        Create invitation codes for new users to join KT Soaps. Share these links on social media or directly with friends.
                    </p>
                </div>

                <JoinCodeDashboard codes={serializedCodes} baseUrl={baseUrl} />
            </div>
        </>
    )
}

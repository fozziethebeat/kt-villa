import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Plus, Beaker, Droplets, Calendar, Hash, Inbox, KeyRound } from 'lucide-react'
import { CopyableCode } from '@/components/CopyableCode'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/Header'
import { RequestActions } from './RequestActions'

const links = [
    { url: '/', label: 'Home' },
    { url: '/admin', label: 'Admin' },
]

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    SCHEDULING: { label: 'Scheduling', variant: 'outline' },
    STARTED: { label: 'Started', variant: 'default' },
    CURING: { label: 'Curing', variant: 'secondary' },
    READY: { label: 'Ready', variant: 'outline' },
    ARCHIVED: { label: 'Archived', variant: 'destructive' },
}

const STATUS_COLORS: Record<string, string> = {
    SCHEDULING: 'border-brand-sage/40 text-brand-sage bg-brand-sage-light',
}

export default async function BatchesPage() {
    const batches = await prisma.batch.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            baseRecipe: true,
            styleRecipe: true,
        }
    })

    const pendingRequests = await prisma.batchRequest.findMany({
        where: { status: 'PENDING' },
        include: {
            user: true,
            styleRecipe: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <>
            <Header links={links} target="Batches" />
            <div className="container mx-auto py-10 px-4 md:px-8 space-y-10">

                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Inbox className="h-5 w-5 text-brand-terracotta" />
                            <h2 className="text-xl font-semibold tracking-tight text-brand-warm-brown">
                                Incoming Requests
                                <Badge variant="outline" className="ml-3 bg-brand-terracotta-light text-brand-terracotta border-brand-terracotta/20">
                                    {pendingRequests.length}
                                </Badge>
                            </h2>
                        </div>
                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-brand-cream border-b border-border">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium text-brand-stone">Date</th>
                                        <th className="text-left px-4 py-3 font-medium text-brand-stone">User</th>
                                        <th className="text-left px-4 py-3 font-medium text-brand-stone">Style</th>
                                        <th className="text-left px-4 py-3 font-medium text-brand-stone">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {pendingRequests.map(request => (
                                        <tr key={request.id} className="hover:bg-brand-cream/50 transition-colors">
                                            <td className="px-4 py-3 text-brand-stone">
                                                {request.createdAt.toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <span className="font-medium text-brand-warm-brown">{request.user.name || 'Unknown'}</span>
                                                    <span className="block text-xs text-brand-stone">{request.user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-brand-warm-brown">{request.styleRecipe.name}</td>
                                            <td className="px-4 py-3">
                                                <RequestActions requestId={request.id} currentStatus={request.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Batches Section */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">Soap Batches</h1>
                            <p className="text-brand-stone mt-2">
                                Manage your soap production batches.
                            </p>
                        </div>
                        <Button asChild className="bg-brand-warm-brown hover:bg-brand-warm-brown/90 text-brand-cream">
                            <Link href="/admin/batches/new">
                                <Plus className="mr-2 h-4 w-4" /> New Batch
                            </Link>
                        </Button>
                    </div>

                    {batches.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-brand-terracotta/20 bg-brand-cream/50 p-12 text-center">
                            <Droplets className="h-12 w-12 text-brand-terracotta/30 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold mb-2 text-brand-warm-brown">No batches yet</h2>
                            <p className="text-brand-stone text-sm mb-6">
                                Create your first soap batch to get started.
                            </p>
                            <Button asChild className="bg-brand-warm-brown hover:bg-brand-warm-brown/90 text-brand-cream">
                                <Link href="/admin/batches/new">
                                    <Plus className="mr-2 h-4 w-4" /> Create Batch
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {batches.map((batch) => {
                                const statusStyle = STATUS_STYLES[batch.status] || STATUS_STYLES.STARTED
                                const extraColor = STATUS_COLORS[batch.status] || ''
                                return (
                                    <Link
                                        key={batch.id}
                                        href={`/admin/batches/${batch.id}`}
                                        className="group block rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all hover:border-brand-terracotta/30"
                                    >
                                        {batch.imageUrl ? (
                                            <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-brand-cream">
                                                <img
                                                    src={batch.imageUrl}
                                                    alt={batch.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-brand-terracotta-light to-brand-rose-light flex items-center justify-center">
                                                <Droplets className="h-12 w-12 text-brand-terracotta/25" />
                                            </div>
                                        )}
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-base truncate text-brand-warm-brown">{batch.name}</h3>
                                                <Badge variant={statusStyle.variant} className={`shrink-0 text-xs ${extraColor}`}>
                                                    {statusStyle.label}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1.5 text-sm text-brand-stone">
                                                <div className="flex items-center gap-2">
                                                    <Beaker className="h-3.5 w-3.5" />
                                                    <span className="truncate">Base: {batch.baseRecipe.name}</span>
                                                </div>
                                                {batch.styleRecipe && (
                                                    <div className="flex items-center gap-2">
                                                        <Droplets className="h-3.5 w-3.5" />
                                                        <span className="truncate">Style: {batch.styleRecipe.name}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>{batch.startedAt.toLocaleDateString()}</span>
                                                </div>
                                                {batch.numBars !== null && (
                                                    <div className="flex items-center gap-2">
                                                        <Hash className="h-3.5 w-3.5" />
                                                        <span>{batch.numBars} bars</span>
                                                    </div>
                                                )}
                                            </div>
                                            {batch.magicCodeId && (
                                                <CopyableCode code={batch.magicCodeId} />
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </section>
            </div>
        </>
    )
}

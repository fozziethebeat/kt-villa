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
    SCHEDULING: 'border-violet-200 text-violet-700 bg-violet-50',
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
                            <Inbox className="h-5 w-5 text-amber-600" />
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                Incoming Requests
                                <Badge variant="outline" className="ml-3 bg-amber-100 text-amber-700 border-amber-200">
                                    {pendingRequests.length}
                                </Badge>
                            </h2>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                                        <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                                        <th className="text-left px-4 py-3 font-medium text-slate-600">Style</th>
                                        <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pendingRequests.map(request => (
                                        <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-slate-600">
                                                {request.createdAt.toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <span className="font-medium text-slate-900">{request.user.name || 'Unknown'}</span>
                                                    <span className="block text-xs text-slate-500">{request.user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900">{request.styleRecipe.name}</td>
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
                            <h1 className="text-3xl font-bold tracking-tight">Soap Batches</h1>
                            <p className="text-muted-foreground mt-2">
                                Manage your soap production batches.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href="/admin/batches/new">
                                <Plus className="mr-2 h-4 w-4" /> New Batch
                            </Link>
                        </Button>
                    </div>

                    {batches.length === 0 ? (
                        <div className="rounded-md border bg-card text-card-foreground shadow-sm p-12 text-center">
                            <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-lg font-semibold mb-2">No batches yet</h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                Create your first soap batch to get started.
                            </p>
                            <Button asChild>
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
                                        className="group block rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all hover:border-primary/30"
                                    >
                                        {batch.imageUrl ? (
                                            <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
                                                <img
                                                    src={batch.imageUrl}
                                                    alt={batch.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                                                <Droplets className="h-12 w-12 text-indigo-200" />
                                            </div>
                                        )}
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-base truncate">{batch.name}</h3>
                                                <Badge variant={statusStyle.variant} className={`shrink-0 text-xs ${extraColor}`}>
                                                    {statusStyle.label}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1.5 text-sm text-muted-foreground">
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

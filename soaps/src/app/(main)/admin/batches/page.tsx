import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Plus, Beaker, Droplets, Calendar, Hash, Inbox, Camera, ArrowRight, CheckCircle2 } from 'lucide-react'
import { CopyableCode } from '@/components/CopyableCode'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/Header'
import { RequestActions } from './RequestActions'
import { formatDate } from '@/lib/utils'

const links = [
    { url: '/', label: 'Home' },
    { url: '/admin/batches', label: 'Studio' },
]

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    SCHEDULING: { label: 'Scheduling', variant: 'outline' },
    STARTED: { label: 'Started', variant: 'default' },
    CURING: { label: 'Curing', variant: 'secondary' },
    READY: { label: 'Ready', variant: 'outline' },
    ARCHIVED: { label: 'Archived', variant: 'destructive' },
}

export default async function BatchesPage() {
    const [batches, pendingRequests] = await Promise.all([
        prisma.batch.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                baseRecipe: true,
                styleRecipe: true,
            }
        }),
        prisma.batchRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                user: true,
                styleRecipe: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
    ])

    const readyMissingPhoto = batches.filter(
        (b) => b.status === 'READY' && !b.photoUrl
    )
    const curingMissingPhoto = batches.filter(
        (b) => (b.status === 'CURING' || b.status === 'STARTED') && !b.photoUrl
    )

    return (
        <>
            <Header links={links} target="Batches" />
            <div className="container mx-auto py-10 px-4 md:px-8 space-y-10">

                {/* Studio Photography Action Items */}
                <section className="border border-border bg-card p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <Camera className="h-5 w-5 text-mineral-moss" />
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">
                                Photography action items
                            </h2>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {readyMissingPhoto.length} ready {readyMissingPhoto.length === 1 ? 'batch' : 'batches'} waiting for a real photo
                        </span>
                    </div>

                    <div className="divide-y divide-border border-t border-border text-sm">
                        {/* Standing reminder for landing page hero placeholder */}
                        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <p className="font-medium text-foreground">
                                    Replace landing page hero placeholder with real soap photography
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Currently using AI studio placeholders at <code className="text-foreground">public/images/hero-mineral.jpg</code> and <code className="text-foreground">public/images/soap-placeholder.jpg</code>.
                                </p>
                            </div>
                            <Link
                                href="/"
                                className="text-xs font-medium text-mineral-moss hover:underline underline-offset-4 shrink-0 inline-flex items-center gap-1"
                            >
                                Preview landing page <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        {/* Ready batches missing a real soap photo */}
                        {readyMissingPhoto.map((batch) => (
                            <div
                                key={batch.id}
                                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                                <div>
                                    <p className="font-medium text-foreground">
                                        Upload real soap photo for {batch.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                                        Ready batch · Currently showing {batch.imageUrl ? 'AI label artwork' : 'placeholder'} on the landing page
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/batches/${batch.id}#soap-photo`}
                                    className="text-xs font-medium text-foreground underline underline-offset-4 decoration-border hover:text-mineral-moss hover:decoration-mineral-moss shrink-0 inline-flex items-center gap-1"
                                >
                                    Upload photo <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        ))}

                        {/* Curing batches reminder (grouped compactly) */}
                        {curingMissingPhoto.length > 0 && (
                            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <p className="font-medium text-foreground">
                                        Upcoming curing batches to photograph once cut &amp; cured ({curingMissingPhoto.length})
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {curingMissingPhoto.map((b) => b.name).join(', ')}
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/batches/${curingMissingPhoto[0].id}#soap-photo`}
                                    className="text-xs font-medium text-muted-foreground hover:text-foreground shrink-0 inline-flex items-center gap-1"
                                >
                                    Open first <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        )}

                        {readyMissingPhoto.length === 0 && curingMissingPhoto.length === 0 && (
                            <div className="py-3.5 flex items-center gap-2 text-mineral-moss">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-medium">All active batches have real soap photos uploaded.</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Inbox className="h-5 w-5 text-mineral-moss" />
                            <h2 className="text-xl font-semibold tracking-tight text-foreground">
                                Incoming Requests
                                <Badge variant="outline" className="ml-3">
                                    {pendingRequests.length}
                                </Badge>
                            </h2>
                        </div>
                        <div className="bg-card border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-secondary/60 border-b border-border">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Style</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {pendingRequests.map(request => (
                                        <tr key={request.id} className="hover:bg-secondary/30 transition-colors">
                                            <td className="px-4 py-3 text-muted-foreground tabular-nums">
                                                {formatDate(request.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <span className="font-medium text-foreground">{request.user.name || 'Unknown'}</span>
                                                    <span className="block text-xs text-muted-foreground">{request.user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">{request.styleRecipe.name}</td>
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
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Soap Batches</h1>
                            <p className="text-muted-foreground mt-2">
                                Manage production batches, real photography, and AI label artwork.
                            </p>
                        </div>
                        <Button asChild className="bg-foreground hover:bg-mineral-moss text-background">
                            <Link href="/admin/batches/new">
                                <Plus className="mr-2 h-4 w-4" /> New Batch
                            </Link>
                        </Button>
                    </div>

                    {batches.length === 0 ? (
                        <div className="border border-dashed border-border bg-card p-12 text-center">
                            <Droplets className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold mb-2 text-foreground">No batches yet</h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                Create your first soap batch to get started.
                            </p>
                            <Button asChild className="bg-foreground hover:bg-mineral-moss text-background">
                                <Link href="/admin/batches/new">
                                    <Plus className="mr-2 h-4 w-4" /> Create Batch
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {batches.map((batch) => {
                                const statusStyle = STATUS_STYLES[batch.status] || STATUS_STYLES.STARTED
                                const previewImg = batch.photoUrl || batch.imageUrl
                                const needsPhoto = (batch.status === 'READY' || batch.status === 'CURING') && !batch.photoUrl
                                return (
                                    <Link
                                        key={batch.id}
                                        href={`/admin/batches/${batch.id}`}
                                        className="group block border border-border bg-card hover:border-foreground/40 transition-colors duration-150"
                                    >
                                        {previewImg ? (
                                            <div className="aspect-video w-full overflow-hidden bg-secondary">
                                                <img
                                                    src={previewImg}
                                                    alt={batch.name}
                                                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-video w-full overflow-hidden bg-secondary flex items-center justify-center">
                                                <Droplets className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-base truncate text-foreground">{batch.name}</h3>
                                                <Badge variant={statusStyle.variant} className="shrink-0 text-xs">
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
                                                <div className="flex items-center gap-2 tabular-nums">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>{formatDate(batch.startedAt)}</span>
                                                </div>
                                                {batch.numBars !== null && (
                                                    <div className="flex items-center gap-2 tabular-nums">
                                                        <Hash className="h-3.5 w-3.5" />
                                                        <span>{batch.numBars} bars</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-xs pt-1">
                                                    <Camera className="h-3.5 w-3.5" />
                                                    <span className={needsPhoto ? 'text-mineral-moss font-medium' : 'text-muted-foreground'}>
                                                        {batch.photoUrl ? 'Real soap photo uploaded' : needsPhoto ? 'Needs real soap photo' : 'No soap photo yet'}
                                                    </span>
                                                </div>
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

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Plus, Beaker, Droplets, Calendar, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/Header'

const links = [
    { url: '/', label: 'Home' },
    { url: '/admin', label: 'Admin' },
]

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    STARTED: { label: 'Started', variant: 'default' },
    CURING: { label: 'Curing', variant: 'secondary' },
    READY: { label: 'Ready', variant: 'outline' },
    ARCHIVED: { label: 'Archived', variant: 'destructive' },
}

export default async function BatchesPage() {
    const batches = await prisma.batch.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            baseRecipe: true,
            styleRecipe: true,
        }
    })

    return (
        <>
            <Header links={links} target="Batches" />
            <div className="container mx-auto py-10 px-4 md:px-8">
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
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}

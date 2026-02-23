import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Beaker, Droplets, Calendar, Hash, ImageIcon, Wind, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const links = [
    { url: '/', label: 'Home' },
]

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
    SCHEDULING: { label: 'Scheduling', color: 'bg-brand-sage-light text-brand-sage' },
    STARTED: { label: 'Started', color: 'bg-brand-terracotta-light text-brand-terracotta' },
    CURING: { label: 'Curing', color: 'bg-brand-sage-light text-brand-sage' },
    READY: { label: 'Ready', color: 'bg-brand-rose-light text-brand-rose' },
    ARCHIVED: { label: 'Archived', color: 'bg-brand-linen text-brand-stone' },
}

function getAgeInWeeks(date: Date) {
    const diffTime = Math.abs(new Date().getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / 7)
}

export default async function BatchViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
            baseRecipe: true,
            styleRecipe: true,
            images: {
                orderBy: { version: 'desc' },
            },
        }
    })

    if (!batch) {
        notFound()
    }

    // Only show active batches to regular users (not SCHEDULING or ARCHIVED)
    if (batch.status === 'SCHEDULING' || batch.status === 'ARCHIVED') {
        notFound()
    }

    const statusInfo = STATUS_DISPLAY[batch.status] || STATUS_DISPLAY.STARTED
    const ageWeeks = getAgeInWeeks(batch.startedAt)
    const isCuring = batch.status === 'CURING' || batch.status === 'STARTED'

    return (
        <>
            <Header links={links} target={batch.name} />
            <div className="container mx-auto py-10 px-4 md:px-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">
                                {batch.name}
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-sm text-brand-stone">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Started {formatDate(batch.startedAt)}
                                </span>
                                {isCuring && (
                                    <span className="flex items-center gap-1.5 text-brand-sage font-medium">
                                        <Wind className="h-4 w-4" />
                                        Curing for {ageWeeks} {ageWeeks === 1 ? 'week' : 'weeks'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Badge className={`${statusInfo.color} shrink-0 text-sm px-3 py-1`}>
                            {statusInfo.label}
                        </Badge>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Left Column — Image */}
                        <div className="space-y-6">
                            {/* Main Image */}
                            <Card className="border-border overflow-hidden">
                                {batch.imageUrl ? (
                                    <div className="aspect-square w-full overflow-hidden bg-brand-cream">
                                        <img
                                            src={batch.imageUrl}
                                            alt={batch.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-square w-full flex flex-col items-center justify-center bg-gradient-to-br from-brand-terracotta-light to-brand-rose-light">
                                        <Droplets className="h-16 w-16 text-brand-terracotta/30 mb-3" />
                                        <p className="text-sm text-brand-stone">No image available</p>
                                    </div>
                                )}
                            </Card>

                            {/* Image Gallery (if multiple images exist) */}
                            {batch.images.length > 1 && (
                                <Card className="border-border">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2 text-brand-warm-brown">
                                            <ImageIcon className="h-4 w-4 text-brand-terracotta" />
                                            Gallery
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-2">
                                            {batch.images.map((image) => {
                                                const isActive = image.imageUrl === batch.imageUrl
                                                return (
                                                    <div
                                                        key={image.id}
                                                        className={`relative rounded-md overflow-hidden border-2 aspect-square ${isActive
                                                                ? 'border-brand-terracotta ring-2 ring-brand-terracotta/30'
                                                                : 'border-border'
                                                            }`}
                                                    >
                                                        <img
                                                            src={image.imageUrl}
                                                            alt={`Version ${image.version}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {isActive && (
                                                            <div className="absolute inset-0 flex items-end justify-center pb-1 bg-gradient-to-t from-black/50 to-transparent">
                                                                <span className="text-white text-xs font-medium">
                                                                    ✓ Current
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Right Column — Details */}
                        <div className="space-y-6">
                            {/* Recipes */}
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="text-base text-brand-warm-brown">Recipes</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 rounded-md bg-brand-cream/50">
                                        <Beaker className="h-5 w-5 text-brand-terracotta shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-brand-warm-brown">
                                                Base: {batch.baseRecipe.name}
                                            </p>
                                            <p className="text-xs text-brand-stone">
                                                {(batch.baseRecipe.ingredients as any[]).map((i: any) => i.name).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                    {batch.styleRecipe && (
                                        <div className="flex items-center gap-3 p-3 rounded-md bg-brand-cream/50">
                                            <Droplets className="h-5 w-5 text-brand-rose shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-brand-warm-brown">
                                                    Style: {batch.styleRecipe.name}
                                                </p>
                                                <p className="text-xs text-brand-stone">
                                                    {(batch.styleRecipe.ingredients as any[]).map((i: any) => i.name).join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Batch Info */}
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="text-base text-brand-warm-brown">Batch Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-brand-terracotta shrink-0" />
                                            <div>
                                                <p className="text-xs text-brand-stone">Started</p>
                                                <p className="font-medium text-brand-warm-brown">
                                                    {formatDate(batch.startedAt)}
                                                </p>
                                            </div>
                                        </div>
                                        {batch.cutAt && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-brand-sage shrink-0" />
                                                <div>
                                                    <p className="text-xs text-brand-stone">Cut</p>
                                                    <p className="font-medium text-brand-warm-brown">
                                                        {formatDate(batch.cutAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {batch.readyAt && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-brand-rose shrink-0" />
                                                <div>
                                                    <p className="text-xs text-brand-stone">Ready</p>
                                                    <p className="font-medium text-brand-warm-brown">
                                                        {formatDate(batch.readyAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {batch.numBars !== null && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Hash className="h-4 w-4 text-brand-terracotta shrink-0" />
                                                <div>
                                                    <p className="text-xs text-brand-stone">Bars</p>
                                                    <p className="font-medium text-brand-warm-brown">
                                                        {batch.numBars}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notes */}
                            {batch.notes && (
                                <Card className="border-border">
                                    <CardHeader>
                                        <CardTitle className="text-base text-brand-warm-brown">Notes</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-brand-stone leading-relaxed whitespace-pre-wrap">
                                            {batch.notes}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Ingredients Highlight */}
                            {batch.styleRecipe && (
                                <Card className="border-border bg-brand-cream/30">
                                    <CardHeader>
                                        <CardTitle className="text-base text-brand-warm-brown">Featured Ingredients</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {(batch.styleRecipe.ingredients as any[]).map((ing: any, i: number) => (
                                                <Badge
                                                    key={i}
                                                    variant="outline"
                                                    className="text-sm font-normal text-brand-stone bg-white border-brand-terracotta/15 px-3 py-1"
                                                >
                                                    {ing.name}
                                                    {ing.quantity && (
                                                        <span className="ml-1 text-brand-stone/60">
                                                            {ing.quantity}{ing.unit}
                                                        </span>
                                                    )}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

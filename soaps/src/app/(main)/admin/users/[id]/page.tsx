import prisma from '@/lib/prisma'
import { Header } from '@/components/Header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
    Mail,
    Calendar,
    Shield,
    Droplets,
    Inbox,
    Sparkles,
    Beaker,
    CheckCircle,
    Clock,
    XCircle,
    CalendarCheck,
    Gift,
} from 'lucide-react'

const links = [
    { url: '/', label: 'Home' },
    { url: '/admin', label: 'Admin' },
    { url: '/admin/users', label: 'Users' },
]

const REQUEST_STATUS_CONFIG: Record<string, {
    label: string
    icon: typeof Clock
    className: string
}> = {
    PENDING: {
        label: 'Pending',
        icon: Clock,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    PLANNED: {
        label: 'Planned',
        icon: CalendarCheck,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    FULFILLED: {
        label: 'Fulfilled',
        icon: CheckCircle,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    REJECTED: {
        label: 'Rejected',
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200',
    },
}

export default async function AdminUserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            gifts: {
                orderBy: { givenAt: 'desc' },
                include: {
                    batch: {
                        include: {
                            baseRecipe: true,
                            styleRecipe: true,
                        },
                    },
                },
            },
            requests: {
                orderBy: { createdAt: 'desc' },
                include: {
                    styleRecipe: true,
                },
            },
        },
    })

    if (!user) {
        notFound()
    }

    return (
        <>
            <Header links={links} target={user.name || 'User Detail'} />
            <div className="container mx-auto py-10 px-4 md:px-8 space-y-10">
                {/* User Profile Header */}
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-terracotta-light to-brand-rose-light text-brand-warm-brown font-bold text-2xl shrink-0 shadow-sm">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">
                                {user.name || 'Unnamed User'}
                            </h1>
                            {user.roles === 'admin' ? (
                                <Badge className="bg-brand-terracotta/10 text-brand-terracotta border-brand-terracotta/20">
                                    <Shield className="h-3 w-3 mr-0.5" />
                                    Admin
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-brand-stone border-border">
                                    Member
                                </Badge>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-brand-stone">
                            <span className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                {user.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Joined {formatDate(user.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard
                        icon={<Droplets className="h-5 w-5 text-brand-sage" />}
                        label="Soaps Collected"
                        value={user.gifts.length}
                    />
                    <StatCard
                        icon={<Inbox className="h-5 w-5 text-brand-terracotta" />}
                        label="Total Requests"
                        value={user.requests.length}
                    />
                    <StatCard
                        icon={<Clock className="h-5 w-5 text-amber-600" />}
                        label="Pending"
                        value={user.requests.filter(r => r.status === 'PENDING').length}
                    />
                    <StatCard
                        icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
                        label="Fulfilled"
                        value={user.requests.filter(r => r.status === 'FULFILLED').length}
                    />
                </div>

                {/* Soap Collection */}
                <section>
                    <div className="flex items-center gap-2 mb-5">
                        <Gift className="h-5 w-5 text-brand-terracotta" />
                        <h2 className="text-xl font-semibold tracking-tight text-brand-warm-brown">
                            Soap Collection
                        </h2>
                        <Badge variant="outline" className="ml-1 text-brand-stone border-border">
                            {user.gifts.length}
                        </Badge>
                    </div>

                    {user.gifts.length === 0 ? (
                        <EmptyState
                            icon={<Droplets className="h-10 w-10 text-brand-terracotta/20" />}
                            message="This user hasn't collected any soaps yet."
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {user.gifts.map(gift => {
                                const batch = gift.batch
                                const styleName = batch.styleRecipe?.name
                                return (
                                    <Link
                                        key={gift.id}
                                        href={`/admin/batches/${batch.id}`}
                                        id={`gift-${gift.id}`}
                                    >
                                        <Card className="overflow-hidden border-border shadow-sm hover:shadow-md transition-all duration-300 group hover:border-brand-terracotta/30">
                                            <div className="aspect-[16/9] relative overflow-hidden bg-brand-cream">
                                                {batch.imageUrl ? (
                                                    <img
                                                        src={batch.imageUrl}
                                                        alt={batch.name}
                                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-terracotta-light to-brand-rose-light">
                                                        <Droplets className="h-10 w-10 text-brand-terracotta/25" />
                                                    </div>
                                                )}
                                                <div className="absolute top-3 left-3">
                                                    <Badge className="backdrop-blur-md bg-white/90 shadow-sm border-0 text-brand-warm-brown text-[11px]">
                                                        <Calendar className="mr-1 h-3 w-3" />
                                                        {formatDate(gift.givenAt)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardContent className="p-4 space-y-2">
                                                <h3 className="font-semibold text-brand-warm-brown group-hover:text-brand-terracotta transition-colors truncate">
                                                    {batch.name}
                                                </h3>
                                                <div className="space-y-1 text-xs text-brand-stone">
                                                    <div className="flex items-center gap-1.5">
                                                        <Beaker className="h-3 w-3" />
                                                        <span className="truncate">
                                                            {batch.baseRecipe.name}
                                                        </span>
                                                    </div>
                                                    {styleName && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Sparkles className="h-3 w-3" />
                                                            <span className="truncate">{styleName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {gift.note && (
                                                    <p className="text-xs text-brand-stone/70 italic border-t border-border pt-2">
                                                        &ldquo;{gift.note}&rdquo;
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </section>

                {/* Batch Requests */}
                <section>
                    <div className="flex items-center gap-2 mb-5">
                        <Inbox className="h-5 w-5 text-brand-terracotta" />
                        <h2 className="text-xl font-semibold tracking-tight text-brand-warm-brown">
                            Batch Requests
                        </h2>
                        <Badge variant="outline" className="ml-1 text-brand-stone border-border">
                            {user.requests.length}
                        </Badge>
                    </div>

                    {user.requests.length === 0 ? (
                        <EmptyState
                            icon={<Inbox className="h-10 w-10 text-brand-terracotta/20" />}
                            message="This user hasn't made any batch requests."
                        />
                    ) : (
                        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                            <table className="w-full text-sm" id="requests-table">
                                <thead className="bg-brand-cream border-b border-border">
                                    <tr>
                                        <th className="text-left px-5 py-3.5 font-medium text-brand-stone">
                                            Date
                                        </th>
                                        <th className="text-left px-5 py-3.5 font-medium text-brand-stone">
                                            Style Recipe
                                        </th>
                                        <th className="text-left px-5 py-3.5 font-medium text-brand-stone">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {user.requests.map(request => {
                                        const config =
                                            REQUEST_STATUS_CONFIG[request.status] ||
                                            REQUEST_STATUS_CONFIG.PENDING
                                        const StatusIcon = config.icon
                                        return (
                                            <tr
                                                key={request.id}
                                                className="hover:bg-brand-cream/50 transition-colors"
                                                id={`request-${request.id}`}
                                            >
                                                <td className="px-5 py-3.5 text-brand-stone">
                                                    {formatDate(request.createdAt)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="font-medium text-brand-warm-brown flex items-center gap-1.5">
                                                        <Sparkles className="h-3.5 w-3.5 text-brand-terracotta" />
                                                        {request.styleRecipe.name}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <Badge className={config.className}>
                                                        <StatusIcon className="h-3 w-3 mr-0.5" />
                                                        {config.label}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </>
    )
}

function StatCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value: number
}) {
    return (
        <Card className="border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-cream shrink-0">
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-brand-warm-brown">{value}</p>
                    <p className="text-xs text-brand-stone">{label}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function EmptyState({
    icon,
    message,
}: {
    icon: React.ReactNode
    message: string
}) {
    return (
        <div className="rounded-xl border-2 border-dashed border-brand-terracotta/15 bg-brand-cream/50 p-10 text-center">
            <div className="mx-auto mb-3 w-fit">{icon}</div>
            <p className="text-sm text-brand-stone">{message}</p>
        </div>
    )
}

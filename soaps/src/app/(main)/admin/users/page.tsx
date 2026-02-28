import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Header } from '@/components/Header'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
    Users,
    Mail,
    Calendar,
    Droplets,
    Inbox,
    Shield,
    ChevronRight,
} from 'lucide-react'

const links = [
    { url: '/', label: 'Home' },
    { url: '/admin', label: 'Admin' },
]

export default async function AdminUsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    gifts: true,
                    requests: true,
                },
            },
        },
    })

    const totalUsers = users.length
    const adminCount = users.filter(u => u.roles === 'admin').length

    return (
        <>
            <Header links={links} target="Users" />
            <div className="container mx-auto py-10 px-4 md:px-8 space-y-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">
                        Registered Users
                    </h1>
                    <p className="text-brand-stone mt-2">
                        {totalUsers} {totalUsers === 1 ? 'user' : 'users'} registered
                        {adminCount > 0 && (
                            <span> · {adminCount} {adminCount === 1 ? 'admin' : 'admins'}</span>
                        )}
                    </p>
                </div>

                {/* Users Table */}
                {users.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-brand-terracotta/20 bg-brand-cream/50 p-12 text-center">
                        <Users className="h-12 w-12 text-brand-terracotta/30 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold mb-2 text-brand-warm-brown">
                            No users yet
                        </h2>
                        <p className="text-brand-stone text-sm">
                            Users will appear here once they sign up.
                        </p>
                    </div>
                ) : (
                    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <table className="w-full text-sm" id="users-table">
                                <thead className="bg-brand-cream border-b border-border">
                                    <tr>
                                        <th className="text-left px-5 py-3.5 font-medium text-brand-stone">
                                            User
                                        </th>
                                        <th className="text-left px-5 py-3.5 font-medium text-brand-stone">
                                            Role
                                        </th>
                                        <th className="text-left px-5 py-3.5 font-medium text-brand-stone">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                Joined
                                            </span>
                                        </th>
                                        <th className="text-center px-5 py-3.5 font-medium text-brand-stone">
                                            <span className="flex items-center justify-center gap-1.5">
                                                <Droplets className="h-3.5 w-3.5" />
                                                Soaps
                                            </span>
                                        </th>
                                        <th className="text-center px-5 py-3.5 font-medium text-brand-stone">
                                            <span className="flex items-center justify-center gap-1.5">
                                                <Inbox className="h-3.5 w-3.5" />
                                                Requests
                                            </span>
                                        </th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map(user => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-brand-cream/50 transition-colors group"
                                        >
                                            <td className="px-5 py-4">
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                    className="block"
                                                    id={`user-row-${user.id}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-brand-terracotta-light to-brand-rose-light text-brand-warm-brown font-semibold text-sm shrink-0">
                                                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-brand-warm-brown group-hover:text-brand-terracotta transition-colors">
                                                                {user.name || 'Unnamed User'}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-xs text-brand-stone mt-0.5">
                                                                <Mail className="h-3 w-3" />
                                                                {user.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-5 py-4">
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
                                            </td>
                                            <td className="px-5 py-4 text-brand-stone">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {user._count.gifts > 0 ? (
                                                    <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-brand-sage-light text-brand-sage text-xs font-medium">
                                                        {user._count.gifts}
                                                    </span>
                                                ) : (
                                                    <span className="text-brand-stone/40 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {user._count.requests > 0 ? (
                                                    <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-brand-terracotta-light text-brand-terracotta text-xs font-medium">
                                                        {user._count.requests}
                                                    </span>
                                                ) : (
                                                    <span className="text-brand-stone/40 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <Link href={`/admin/users/${user.id}`}>
                                                    <ChevronRight className="h-4 w-4 text-brand-stone/40 group-hover:text-brand-terracotta transition-colors" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-border">
                            {users.map(user => (
                                <Link
                                    key={user.id}
                                    href={`/admin/users/${user.id}`}
                                    className="flex items-center gap-4 p-4 hover:bg-brand-cream/50 transition-colors"
                                    id={`user-card-${user.id}`}
                                >
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-brand-terracotta-light to-brand-rose-light text-brand-warm-brown font-semibold text-sm shrink-0">
                                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-brand-warm-brown truncate">
                                                {user.name || 'Unnamed User'}
                                            </span>
                                            {user.roles === 'admin' && (
                                                <Badge className="bg-brand-terracotta/10 text-brand-terracotta border-brand-terracotta/20 text-[10px] px-1.5 py-0">
                                                    Admin
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-brand-stone truncate block">
                                            {user.email}
                                        </span>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-brand-stone/70">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(user.createdAt)}
                                            </span>
                                            {user._count.gifts > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Droplets className="h-3 w-3" />
                                                    {user._count.gifts}
                                                </span>
                                            )}
                                            {user._count.requests > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Inbox className="h-3 w-3" />
                                                    {user._count.requests}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-brand-stone/40 shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

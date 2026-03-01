'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Plus,
    Copy,
    Check,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Link as LinkIcon,
    Share2,
    Sparkles,
    KeyRound,
    ExternalLink,
} from 'lucide-react'
import { createJoinCode, toggleJoinCode, deleteJoinCode } from '@/app/actions/join-code'

interface JoinCodeData {
    id: string
    label: string | null
    active: boolean
    createdAt: string
}

export function JoinCodeDashboard({
    codes,
    baseUrl,
}: {
    codes: JoinCodeData[]
    baseUrl: string
}) {
    const [label, setLabel] = useState('')
    const [isPending, startTransition] = useTransition()
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null)

    const handleCreate = () => {
        if (!label.trim()) return
        setFeedback(null)
        startTransition(async () => {
            const result = await createJoinCode(label.trim())
            setFeedback(result)
            if (result.success) setLabel('')
        })
    }

    const handleCopy = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleToggle = (codeId: string, active: boolean) => {
        startTransition(async () => {
            await toggleJoinCode(codeId, active)
        })
    }

    const handleDelete = (codeId: string) => {
        if (!confirm('Are you sure you want to delete this code? Anyone with this link will no longer be able to sign up.')) return
        startTransition(async () => {
            await deleteJoinCode(codeId)
        })
    }

    const getSignupUrl = (codeId: string) => `${baseUrl}/signup?magicCode=${codeId}`

    return (
        <div className="space-y-8">
            {/* Create New Code */}
            <Card className="border-brand-terracotta/20 bg-gradient-to-br from-brand-terracotta-light/30 to-brand-rose-light/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-brand-warm-brown">
                        <Sparkles className="h-5 w-5 text-brand-terracotta" />
                        Create New Join Code
                    </CardTitle>
                    <CardDescription className="text-brand-stone">
                        Generate a shareable link anyone can use to sign up for KT Soaps — no batch required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            placeholder="e.g. Instagram Spring Promo, TikTok Launch..."
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate()
                            }}
                            className="flex-1 bg-white/70 border-brand-terracotta/20 focus:border-brand-terracotta/50 placeholder:text-brand-stone/40"
                        />
                        <Button
                            onClick={handleCreate}
                            disabled={isPending || !label.trim()}
                            className="bg-brand-warm-brown hover:bg-brand-warm-brown/90 text-brand-cream shrink-0"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Code
                        </Button>
                    </div>
                    {feedback && (
                        <p className={`mt-3 text-sm ${feedback.success ? 'text-brand-sage' : 'text-red-500'}`}>
                            {feedback.message}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Codes List */}
            {codes.length === 0 ? (
                <Card className="border-2 border-dashed border-brand-terracotta/20 bg-brand-cream/50">
                    <CardContent className="py-16 text-center">
                        <KeyRound className="h-12 w-12 text-brand-terracotta/25 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-brand-warm-brown mb-1">No join codes yet</h3>
                        <p className="text-sm text-brand-stone">
                            Create your first join code to start sharing signup links.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {codes.map((code) => {
                        const signupUrl = getSignupUrl(code.id)
                        const isCopied = copiedId === code.id
                        const isLinkCopied = copiedId === `link-${code.id}`

                        return (
                            <Card
                                key={code.id}
                                className={`border transition-all duration-200 ${code.active
                                    ? 'border-border hover:border-brand-terracotta/30 hover:shadow-md'
                                    : 'border-border/50 opacity-60'
                                    }`}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Left: Info */}
                                        <div className="flex-1 min-w-0 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-brand-warm-brown truncate">
                                                    {code.label || 'Untitled'}
                                                </h3>
                                                <Badge
                                                    variant="outline"
                                                    className={`shrink-0 text-xs ${code.active
                                                        ? 'bg-brand-sage-light text-brand-sage border-brand-sage/30'
                                                        : 'bg-brand-linen text-brand-stone border-border'
                                                        }`}
                                                >
                                                    {code.active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>

                                            {/* Code row */}
                                            <div className="flex items-center gap-2">
                                                <code className="bg-brand-cream border border-brand-terracotta/15 rounded-md px-3 py-1.5 text-sm font-mono text-brand-terracotta select-all">
                                                    {code.id}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-brand-stone hover:text-brand-terracotta"
                                                    onClick={() => handleCopy(code.id, code.id)}
                                                    title="Copy code"
                                                >
                                                    {isCopied ? (
                                                        <Check className="h-3.5 w-3.5 text-brand-sage" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Signup link row */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 bg-white border border-border rounded-md px-3 py-1.5 flex-1 min-w-0">
                                                    <LinkIcon className="h-3.5 w-3.5 text-brand-stone/50 shrink-0" />
                                                    <span className="text-xs text-brand-stone truncate">{signupUrl}</span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="shrink-0 border-brand-terracotta/20 text-brand-terracotta hover:bg-brand-terracotta-light"
                                                    onClick={() => handleCopy(signupUrl, `link-${code.id}`)}
                                                >
                                                    {isLinkCopied ? (
                                                        <>
                                                            <Check className="mr-1.5 h-3.5 w-3.5" />
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Share2 className="mr-1.5 h-3.5 w-3.5" />
                                                            Copy Link
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Meta */}
                                            <p className="text-xs text-brand-stone/60">
                                                Created {new Date(code.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex flex-col gap-1.5">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-8 w-8 p-0 ${code.active
                                                    ? 'text-brand-sage hover:text-brand-sage'
                                                    : 'text-brand-stone hover:text-brand-warm-brown'
                                                    }`}
                                                onClick={() => handleToggle(code.id, !code.active)}
                                                title={code.active ? 'Deactivate' : 'Activate'}
                                                disabled={isPending}
                                            >
                                                {code.active ? (
                                                    <ToggleRight className="h-5 w-5" />
                                                ) : (
                                                    <ToggleLeft className="h-5 w-5" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(code.id)}
                                                disabled={isPending}
                                                title="Delete code"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

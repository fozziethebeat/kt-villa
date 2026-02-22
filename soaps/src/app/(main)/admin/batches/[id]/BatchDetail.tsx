'use client'

import { useState, useActionState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Beaker, Droplets, Calendar, Hash, Sparkles, Loader2, ImageIcon, Trash2, KeyRound, Copy, Check } from 'lucide-react'
import { updateBatch, generateBatchImage, deleteBatch } from '@/app/actions/batch'
// @ts-ignore
import { useFormStatus } from 'react-dom'

function SaveButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} size="sm" className="bg-brand-warm-brown hover:bg-brand-warm-brown/90 text-brand-cream">
            {pending ? 'Saving...' : 'Save Changes'}
        </Button>
    )
}

interface BatchRecipe {
    id: string
    name: string
    ingredients: any[]
}

interface BatchData {
    id: string
    name: string
    baseRecipeId: string
    styleRecipeId: string | null
    startedAt: string
    cutAt: string | null
    readyAt: string | null
    numBars: number | null
    imageUrl: string | null
    notes: string | null
    status: string
    magicCodeId: string | null
    createdAt: string
    updatedAt: string
    baseRecipe: BatchRecipe
    styleRecipe: BatchRecipe | null
}

const STATUS_OPTIONS = [
    { value: 'STARTED', label: 'Started', color: 'bg-brand-terracotta-light text-brand-terracotta' },
    { value: 'CURING', label: 'Curing', color: 'bg-brand-sage-light text-brand-sage' },
    { value: 'READY', label: 'Ready', color: 'bg-brand-rose-light text-brand-rose' },
    { value: 'ARCHIVED', label: 'Archived', color: 'bg-brand-linen text-brand-stone' },
]

export function BatchDetail({ batch }: { batch: BatchData }) {
    const [updateState, updateAction] = useActionState(updateBatch, { message: '' })
    const [notes, setNotes] = useState(batch.notes || '')
    const [numBars, setNumBars] = useState(batch.numBars?.toString() || '')
    const [status, setStatus] = useState(batch.status)

    // Image generation
    const [imagePrompt, setImagePrompt] = useState('')
    const [isGenerating, startTransition] = useTransition()
    const [imageError, setImageError] = useState('')
    const [generatedImageUrl, setGeneratedImageUrl] = useState(batch.imageUrl || '')

    const [isDeleting, setIsDeleting] = useState(false)
    const [copied, setCopied] = useState(false)

    const signupUrl = batch.magicCodeId
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?magicCode=${batch.magicCodeId}`
        : ''

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleGenerateImage = () => {
        if (!imagePrompt.trim()) return
        setImageError('')
        startTransition(async () => {
            const result = await generateBatchImage(batch.id, imagePrompt)
            if (result.success && result.imageUrl) {
                setGeneratedImageUrl(result.imageUrl)
            } else {
                setImageError(result.error || 'Failed to generate image')
            }
        })
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this batch? This cannot be undone.')) return
        setIsDeleting(true)
        await deleteBatch(batch.id)
    }

    const currentStatus = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]

    return (
        <div className="space-y-6">
            {/* Header & Status */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">{batch.name}</h1>
                    <p className="text-brand-stone mt-1">
                        Started {new Date(batch.startedAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={currentStatus.color}>
                        {currentStatus.label}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column — Info & Edit */}
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
                                    <p className="text-sm font-medium text-brand-warm-brown">Base: {batch.baseRecipe.name}</p>
                                    <p className="text-xs text-brand-stone">
                                        {(batch.baseRecipe.ingredients as any[]).map((i: any) => i.name).join(', ')}
                                    </p>
                                </div>
                            </div>
                            {batch.styleRecipe && (
                                <div className="flex items-center gap-3 p-3 rounded-md bg-brand-cream/50">
                                    <Droplets className="h-5 w-5 text-brand-rose shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-brand-warm-brown">Style: {batch.styleRecipe.name}</p>
                                        <p className="text-xs text-brand-stone">
                                            {(batch.styleRecipe.ingredients as any[]).map((i: any) => i.name).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Invite Code */}
                    {batch.magicCodeId && (
                        <Card className="border-brand-terracotta/20 bg-brand-terracotta-light/30">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2 text-brand-warm-brown">
                                    <KeyRound className="h-4 w-4 text-brand-terracotta" />
                                    Invite Code
                                </CardTitle>
                                <CardDescription className="text-brand-stone">
                                    Share this code with soap recipients so they can sign up and automatically get this batch in their collection.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-white border border-brand-terracotta/20 rounded-md px-3 py-2 text-sm font-mono text-brand-terracotta select-all">
                                        {batch.magicCodeId}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0 border-brand-terracotta/20 text-brand-terracotta hover:bg-brand-terracotta-light"
                                        onClick={() => handleCopy(batch.magicCodeId!)}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <div className="text-xs text-brand-stone">
                                    <span className="font-medium">Signup link:</span>
                                    <button
                                        className="block w-full text-left text-brand-terracotta hover:text-brand-warm-brown underline underline-offset-2 mt-1 break-all cursor-pointer"
                                        onClick={() => handleCopy(signupUrl)}
                                    >
                                        {signupUrl || '(loading...)'}
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Edit Form */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-base text-brand-warm-brown">Batch Details</CardTitle>
                            <CardDescription className="text-brand-stone">Update status, bar count, and notes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={updateAction} className="space-y-4">
                                <input type="hidden" name="id" value={batch.id} />

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-brand-warm-brown mb-1.5">Status</label>
                                    <select
                                        name="status"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Number of Bars */}
                                <div>
                                    <label htmlFor="num-bars" className="block text-sm font-medium text-brand-warm-brown mb-1.5">
                                        Number of Bars
                                    </label>
                                    <Input
                                        type="number"
                                        name="numBars"
                                        id="num-bars"
                                        min="0"
                                        placeholder="Set after cutting..."
                                        value={numBars}
                                        onChange={(e) => setNumBars(e.target.value)}
                                        className="w-32"
                                    />
                                    <p className="text-xs text-brand-stone mt-1">
                                        Set this after the initial 2-day cure when you cut the batch into bars.
                                    </p>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label htmlFor="batch-notes" className="block text-sm font-medium text-brand-warm-brown mb-1.5">Notes</label>
                                    <textarea
                                        name="notes"
                                        id="batch-notes"
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Anything notable about this batch..."
                                        rows={4}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                {updateState?.message && (
                                    <p className={`text-sm ${(updateState as any)?.success ? 'text-brand-sage' : 'text-red-500'}`}>
                                        {(updateState as any)?.success ? 'Saved successfully!' : updateState.message}
                                    </p>
                                )}

                                <div className="flex justify-end">
                                    <SaveButton />
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column — Image */}
                <div className="space-y-6">
                    {/* Current Image */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2 text-brand-warm-brown">
                                <ImageIcon className="h-4 w-4" />
                                Batch Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {generatedImageUrl ? (
                                <div className="rounded-lg overflow-hidden border border-border bg-brand-cream">
                                    <img
                                        src={generatedImageUrl}
                                        alt={batch.name}
                                        className="w-full aspect-square object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-square w-full rounded-lg border-2 border-dashed border-brand-terracotta/20 flex flex-col items-center justify-center bg-brand-cream/30">
                                    <ImageIcon className="h-12 w-12 text-brand-terracotta/20 mb-3" />
                                    <p className="text-sm text-brand-stone">No image yet</p>
                                    <p className="text-xs text-brand-stone/60">Generate one below</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* AI Image Generator */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2 text-brand-warm-brown">
                                <Sparkles className="h-4 w-4 text-brand-terracotta" />
                                Generate AI Image
                            </CardTitle>
                            <CardDescription className="text-brand-stone">
                                Describe the image you want for this batch. Reference the soap style, colors, or mood.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <textarea
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder={`e.g. A beautiful artisan soap bar with ${batch.styleRecipe?.name || 'natural'} design, studio lighting, minimalist background`}
                                rows={3}
                            />
                            <Button
                                onClick={handleGenerateImage}
                                disabled={isGenerating || !imagePrompt.trim()}
                                className="w-full bg-brand-terracotta-light text-brand-terracotta hover:bg-brand-terracotta hover:text-white"
                                variant="secondary"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate Image
                                    </>
                                )}
                            </Button>
                            {imageError && (
                                <p className="text-red-500 text-xs">{imageError}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

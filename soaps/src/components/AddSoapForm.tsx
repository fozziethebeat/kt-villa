'use client'

import { useState } from 'react'
import { addToCollection } from '@/app/actions/collection'
import { Loader2, Check } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export function AddSoapForm() {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return

        setLoading(true)
        setSuccess(false)

        try {
            const result = await addToCollection(code)

            if (result.success) {
                setSuccess(true)
                setCode('')
                toast({
                    title: "Added to collection",
                    description: result.message,
                })
                setTimeout(() => setSuccess(false), 3000)
            } else {
                toast({
                    title: "Could not add soap",
                    description: result.message,
                    variant: "destructive"
                })
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to communicate with server.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter soap code"
                aria-label="Soap code"
                className="h-11 w-full sm:w-64 border border-border bg-card px-4 text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors duration-150"
                disabled={loading}
            />
            <button
                type="submit"
                disabled={loading || !code.trim()}
                className="h-11 px-6 bg-foreground text-background text-[0.9375rem] font-medium hover:bg-mineral-moss transition-colors duration-150 disabled:opacity-40 inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : success ? (
                    <Check className="h-4 w-4" />
                ) : null}
                {success ? 'Added' : 'Add bar'}
            </button>
        </form>
    )
}

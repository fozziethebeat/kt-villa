'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addToCollection } from '@/app/actions/collection'
import { Loader2, Plus, Check, KeyRound } from 'lucide-react'
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
                    title: "Soap Added! 🧼",
                    description: result.message,
                })
                setTimeout(() => setSuccess(false), 3000)
            } else {
                toast({
                    title: "Couldn't add soap",
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
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter soap code..."
                    className="pl-9 font-mono"
                    disabled={loading}
                />
            </div>
            <Button type="submit" disabled={loading || !code.trim()} size="sm">
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : success ? (
                    <Check className="mr-2 h-4 w-4" />
                ) : (
                    <Plus className="mr-2 h-4 w-4" />
                )}
                {success ? 'Added!' : 'Add to Collection'}
            </Button>
        </form>
    )
}

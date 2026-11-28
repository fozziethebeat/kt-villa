'use client'

import { useState } from 'react'
import { requestBatch } from '@/app/actions/request'
import { Loader2, Check } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface RequestButtonProps {
    recipeId: string
    recipeName: string
    requestCount: number
    isScheduled: boolean
}

export function RequestButton({ recipeId, recipeName, requestCount, isScheduled }: RequestButtonProps) {
    const [loading, setLoading] = useState(false)
    const [requested, setRequested] = useState(false)

    const handleRequest = async () => {
        setLoading(true)
        try {
            const result: any = await requestBatch(recipeId)

            if (result.success) {
                setRequested(true)
                toast({
                    title: "Request recorded",
                    description: `The maker has been notified that you would like ${recipeName} in a future batch.`,
                })
            } else {
                toast({
                    title: "Unable to request",
                    description: result.message || "Please sign in to request a batch.",
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

    if (isScheduled) {
        return (
            <span className="inline-flex items-center text-[0.875rem] font-medium text-mineral-moss">
                Scheduled
            </span>
        )
    }

    if (requested) {
        return (
            <span className="inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-mineral-moss">
                <Check className="h-3.5 w-3.5" />
                Requested
            </span>
        )
    }

    return (
        <button
            type="button"
            onClick={handleRequest}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-foreground underline underline-offset-4 decoration-border hover:text-mineral-moss hover:decoration-mineral-moss transition-colors duration-150 disabled:opacity-50 cursor-pointer"
        >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {requestCount > 0 ? 'Add request' : 'Request batch'}
        </button>
    )
}

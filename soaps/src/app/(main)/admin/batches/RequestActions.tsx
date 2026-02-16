'use client'

import { Button } from '@/components/ui/button'
import { acceptRequest, rejectRequest } from '@/app/actions/request'
import { Check, X } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface RequestActionsProps {
    requestId: string
    currentStatus: string
}

export function RequestActions({ requestId, currentStatus }: RequestActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)

    const handleAccept = async () => {
        setLoading('accept')
        try {
            const result = await acceptRequest(requestId)
            if (result.success) {
                toast({ title: "Accepted", description: result.message })
                router.refresh()
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Failed to accept.", variant: "destructive" })
        } finally {
            setLoading(null)
        }
    }

    const handleReject = async () => {
        setLoading('reject')
        try {
            const result = await rejectRequest(requestId)
            if (result.success) {
                toast({ title: "Rejected", description: result.message })
                router.refresh()
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Failed to reject.", variant: "destructive" })
        } finally {
            setLoading(null)
        }
    }

    if (currentStatus !== 'PENDING') {
        return (
            <span className="text-xs text-slate-400 italic capitalize">
                {currentStatus.toLowerCase()}
            </span>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={handleAccept}
                disabled={loading !== null}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Accept
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                disabled={loading !== null}
                className="text-red-600 border-red-200 hover:bg-red-50"
            >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Reject
            </Button>
        </div>
    )
}

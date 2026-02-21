'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { requestBatch } from '@/app/actions/request'
import { Loader2, Check, Sparkles, CalendarCheck } from 'lucide-react'
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
                    title: "Request Sent!",
                    description: `Admin has been notified for ${recipeName}.`,
                })
            } else {
                toast({
                    title: "Something went wrong",
                    description: result.message || "Failed to send request.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to communicate with server.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    // Already scheduled — show a locked-in state
    if (isScheduled) {
        return (
            <Button variant="outline" disabled className="w-full mt-4 bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default">
                <CalendarCheck className="mr-2 h-4 w-4" />
                Already Scheduled
            </Button>
        )
    }

    // User just submitted a request this session
    if (requested) {
        return (
            <Button variant="outline" disabled className="w-full mt-4 bg-green-50 text-green-600 border-green-200">
                <Check className="mr-2 h-4 w-4" />
                Request Sent
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            className="w-full mt-4 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={handleRequest}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4" />
            )}
            {requestCount > 0 ? 'Add Your Request' : 'Request This Style'}
        </Button>
    )
}

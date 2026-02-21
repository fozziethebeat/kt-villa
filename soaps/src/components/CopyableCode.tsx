'use client'

import { useState } from 'react'
import { KeyRound, Copy, Check } from 'lucide-react'

interface CopyableCodeProps {
    code: string
}

export function CopyableCode({ code }: CopyableCodeProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="mt-2 flex items-center gap-1.5 w-full rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 text-xs font-mono text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer group"
            title="Click to copy"
        >
            <KeyRound className="h-3 w-3 shrink-0 text-indigo-400" />
            <span className="truncate flex-1 text-left">{code}</span>
            {copied ? (
                <Check className="h-3 w-3 shrink-0 text-emerald-600" />
            ) : (
                <Copy className="h-3 w-3 shrink-0 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </button>
    )
}

'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/app/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, X, Loader2 } from 'lucide-react'
// @ts-ignore
import { useFormStatus } from 'react-dom'
import { toast } from '@/components/ui/use-toast'

const initialState = {
    message: '',
    success: false
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
            ) : (
                'Save Changes'
            )}
        </Button>
    )
}

interface ProfileFormProps {
    user: any // Ideally User type from prisma
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [state, formAction] = useActionState(updateProfile, initialState)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (state.success) {
            toast({
                title: "Profile updated",
                description: "Your profile changes have been saved successfully.",
            })
            // Reset state if needed, but keeping changes visible is usually better
        } else if (state.message && !state.success) {
            toast({
                title: "Error",
                description: state.message,
                variant: "destructive",
            })
        }
    }, [state])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 1 * 1024 * 1024) { // 1MB limit
                toast({
                    title: "File too large",
                    description: "Image must be less than 1MB",
                    variant: "destructive"
                })
                e.target.value = ''
                return
            }
            const objectUrl = URL.createObjectURL(file)
            setPreviewUrl(objectUrl)
        }
    }

    const clearPreview = () => {
        setPreviewUrl(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const currentImage = previewUrl || user.image || user.profileImageUrl

    return (
        <form action={formAction} className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-8 items-start">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
                    <div className="relative group">
                        <Avatar className="h-32 w-32 border-4 border-slate-50 shadow-md">
                            <AvatarImage src={currentImage} className="object-cover" />
                            <AvatarFallback className="text-4xl bg-indigo-50 text-indigo-600">
                                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>

                        <div
                            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="text-white h-8 w-8" />
                        </div>

                        {previewUrl && (
                            <button
                                type="button"
                                onClick={clearPreview}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="text-center">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Change Avatar
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            name="avatar"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            JPG, GIF or PNG. Max 1MB.
                        </p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-6 w-full">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            defaultValue={user.email}
                            disabled
                            className="bg-slate-50"
                        />
                        <p className="text-xs text-muted-foreground">
                            Email cannot be changed directly.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={user.name || ''}
                            placeholder="Enter your name"
                        />
                        <p className="text-xs text-muted-foreground">
                            This name will be displayed on your batches and profile.
                        </p>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100">
                        <Button type="button" variant="ghost" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                        <SubmitButton />
                    </div>

                    {state.message && !state.success && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                            {state.message}
                        </div>
                    )}
                </div>
            </div>
        </form>
    )
}

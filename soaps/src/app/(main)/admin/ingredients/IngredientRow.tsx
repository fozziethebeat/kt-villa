'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Beaker, Leaf, Pencil, Check, X } from 'lucide-react'
import { RecipeType } from '@/lib/generated/prisma'
import { updateIngredientQuantity } from '@/app/actions/ingredient'
import { useActionState } from 'react'

interface IngredientDisplay {
    id: string
    name: string
    quantity: number
    unit: string
    type: RecipeType
    notes: string | null
}

export function IngredientRow({ ingredient }: { ingredient: IngredientDisplay }) {
    const isInfinite = ingredient.name.toLowerCase().includes('distilled water')
    const [isEditing, setIsEditing] = useState(false)
    const [tempQuantity, setTempQuantity] = useState(ingredient.quantity.toString())

    const handleSave = async (formData: FormData) => {
        // Just wrap the action nicely if needed, or pass directly
        // But since we want to toggle editing off, maybe better to wrap or use formatting
        // Actually, let's use a form action directly in the form
        return updateIngredientQuantity({}, formData)
    }

    // We can't easily hook into form action completion to close the edit mode with just action={action}
    // So let's just make a small wrapper component for the edit form if we want that, 
    // or just handle the submit manually.
    // Let's do a simple onSubmit handler for now to keep it lightweight client-side

    // But to use the server action properly we should use form action.
    // Let's try simple controlled handling.

    return (
        <div className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-muted/50 transition-colors">
            <div className="col-span-4 font-medium truncate">
                {ingredient.name}
            </div>
            <div className="col-span-2">
                {ingredient.type === RecipeType.BASE ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Beaker className="w-3 h-3 mr-1" /> Base
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Leaf className="w-3 h-3 mr-1" /> Style
                    </Badge>
                )}
            </div>
            <div className="col-span-3 text-right font-mono flex items-center justify-end gap-2">
                {isEditing ? (
                    <EditQuantityForm
                        id={ingredient.id}
                        initialQuantity={ingredient.quantity}
                        onCancel={() => setIsEditing(false)}
                        onSuccess={() => setIsEditing(false)}
                    />
                ) : (
                    <>
                        <span>
                            {isInfinite ? <span className="text-xl">∞</span> : ingredient.quantity}
                        </span>
                        <span className="text-muted-foreground text-xs">{ingredient.unit}</span>
                        {!isInfinite && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-2 text-muted-foreground hover:text-foreground"
                                onClick={() => setIsEditing(true)}
                            >
                                <Pencil className="h-3 w-3" />
                                <span className="sr-only">Edit</span>
                            </Button>
                        )}
                    </>
                )}
            </div>
            <div className="col-span-3 pl-4 text-muted-foreground truncate text-xs">
                {ingredient.notes || <span className="opacity-30 italic">--</span>}
            </div>
        </div>
    )
}

function EditQuantityForm({ id, initialQuantity, onCancel, onSuccess }: { id: string, initialQuantity: number, onCancel: () => void, onSuccess: () => void }) {
    const [state, action, isPending] = useActionState(async (prev: any, formData: FormData) => {
        const result = await updateIngredientQuantity(prev, formData)
        if (result.success) {
            onSuccess()
        }
        return result
    }, {})

    return (
        <form action={action} className="flex items-center gap-1 justify-end">
            <input type="hidden" name="id" value={id} />
            <Input
                name="quantity"
                type="number"
                step="0.01"
                defaultValue={initialQuantity}
                className="h-7 w-20 px-2 py-1 text-right"
                autoFocus
            />
            <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" disabled={isPending}>
                <Check className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onCancel}>
                <X className="h-4 w-4" />
            </Button>
        </form>
    )
}

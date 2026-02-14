'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createIngredient, IngredientState } from '@/app/actions/ingredient'
import { RecipeType } from '@/lib/generated/prisma'
// @ts-ignore
import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Ingredient'}
        </Button>
    )
}

const initialState: IngredientState = {
    error: {},
}

export function IngredientForm() {
    const [state, formAction] = useActionState(createIngredient, initialState)
    const [type, setType] = useState<RecipeType>(RecipeType.BASE)

    return (
        <form action={formAction} className="space-y-6 max-w-xl bg-white p-6 rounded-lg shadow-sm border">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <Input name="name" id="name" required className="mt-1" placeholder="e.g. Olive Oil" />
                {state?.error?.name && (
                    <p className="text-red-500 text-sm mt-1">{state.error.name[0]}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                    <Input name="quantity" id="quantity" type="number" step="0.01" required className="mt-1" placeholder="0.00" />
                    {state?.error?.quantity && (
                        <p className="text-red-500 text-sm mt-1">{state.error.quantity[0]}</p>
                    )}
                </div>
                <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
                    <Input name="unit" id="unit" defaultValue="g" className="mt-1" placeholder="g, ml, oz" />
                    {state?.error?.unit && (
                        <p className="text-red-500 text-sm mt-1">{state.error.unit[0]}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="type"
                            value={RecipeType.BASE}
                            checked={type === RecipeType.BASE}
                            onChange={() => setType(RecipeType.BASE)}
                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Base</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="type"
                            value={RecipeType.STYLE}
                            checked={type === RecipeType.STYLE}
                            onChange={() => setType(RecipeType.STYLE)}
                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Style</span>
                    </label>
                </div>
            </div>

            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                    name="notes"
                    id="notes"
                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Any additional notes..."
                    rows={3}
                />
            </div>

            {state?.error?._form && (
                <p className="text-red-500 text-sm">{state.error._form[0]}</p>
            )}

            <div className="flex justify-end">
                <SubmitButton />
            </div>
        </form>
    )
}

'use client'

import { useState, useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { createBatch } from '@/app/actions/batch'
// @ts-ignore
import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create Batch'}
        </Button>
    )
}

interface Recipe {
    id: string
    name: string
    type: string
}

interface BatchFormProps {
    baseRecipes: Recipe[]
    styleRecipes: Recipe[]
}

const initialState = {
    message: '',
}

export function BatchForm({ baseRecipes, styleRecipes }: BatchFormProps) {
    const [state, formAction] = useActionState(createBatch, initialState)
    const [baseRecipeId, setBaseRecipeId] = useState("")
    const [styleRecipeId, setStyleRecipeId] = useState("")
    const [name, setName] = useState("")
    const [startedAt, setStartedAt] = useState(new Date().toISOString().split('T')[0])
    const [notes, setNotes] = useState("")

    const selectedBase = baseRecipes.find(r => r.id === baseRecipeId)
    const selectedStyle = styleRecipes.find(r => r.id === styleRecipeId)

    // Auto-generate name when recipes are selected
    const autoName = [selectedBase?.name, selectedStyle?.name].filter(Boolean).join(' + ')

    return (
        <div className="max-w-2xl bg-white p-6 rounded-lg shadow-sm border space-y-6">
            <form action={formAction} className="space-y-6">
                {/* Batch Name */}
                <div>
                    <label htmlFor="batch-name" className="block text-sm font-medium text-gray-700">Batch Name</label>
                    <Input
                        name="name"
                        id="batch-name"
                        required
                        className="mt-1"
                        placeholder={autoName || "e.g. Spring Lavender Batch"}
                        value={name || autoName}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        A name will be auto-suggested from your recipe selections.
                    </p>
                </div>

                {/* Base Recipe */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Recipe <span className="text-red-500">*</span></label>
                    <input type="hidden" name="baseRecipeId" value={baseRecipeId} />
                    <RecipeSelect
                        value={baseRecipeId}
                        onChange={setBaseRecipeId}
                        options={baseRecipes}
                        placeholder="Select a base recipe..."
                    />
                    {baseRecipes.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                            No base recipes found. Create one first in the Recipes section.
                        </p>
                    )}
                </div>

                {/* Style Recipe */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Style Recipe</label>
                    <input type="hidden" name="styleRecipeId" value={styleRecipeId} />
                    <RecipeSelect
                        value={styleRecipeId}
                        onChange={setStyleRecipeId}
                        options={styleRecipes}
                        placeholder="Select a style recipe (optional)..."
                    />
                </div>

                {/* Start Date */}
                <div>
                    <label htmlFor="started-at" className="block text-sm font-medium text-gray-700">Start Date</label>
                    <Input
                        type="date"
                        name="startedAt"
                        id="started-at"
                        required
                        className="mt-1 w-48"
                        value={startedAt}
                        onChange={(e) => setStartedAt(e.target.value)}
                    />
                </div>

                {/* Notes */}
                <div>
                    <label htmlFor="batch-notes" className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                        name="notes"
                        id="batch-notes"
                        className="mt-1 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Anything notable about this batch... temperature, weather, substitutions, etc."
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {state?.message && (
                    <p className="text-red-500 text-sm">{state.message}</p>
                )}

                <div className="flex justify-end">
                    <SubmitButton />
                </div>
            </form>
        </div>
    )
}

function RecipeSelect({ value, onChange, options, placeholder }: {
    value: string
    onChange: (val: string) => void
    options: Recipe[]
    placeholder: string
}) {
    const [open, setOpen] = useState(false)
    const selected = options.find(o => o.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {selected ? selected.name : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search recipes..." />
                    <CommandList>
                        <CommandEmpty>No recipes found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={option.name}
                                    onSelect={() => {
                                        onChange(option.id === value ? "" : option.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

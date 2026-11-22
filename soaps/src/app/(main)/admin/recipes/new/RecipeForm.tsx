'use client'

import { useState, useActionState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronsUpDown, Plus, Sparkles, Loader2, Trash2, Info, Scale } from 'lucide-react'
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
import { createRecipe, updateRecipe } from '@/app/actions/recipe'
import { generateRecipe } from '@/app/actions/ai-recipe'
// @ts-ignore
import { useFormStatus } from 'react-dom'

function SubmitButton({ isEdit }: { isEdit: boolean }) {
    const { pending } = useFormStatus()
    return (
        <Button
            type="submit"
            disabled={pending}
            className="bg-brand-warm-brown hover:bg-brand-warm-brown/90 text-brand-cream"
        >
            {pending ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Recipe'}
        </Button>
    )
}

interface IngredientRow {
    _id: string
    name: string
    quantity: string
    unit: string
}

export interface EditableRecipe {
    id: string
    name: string
    type: "BASE" | "STYLE"
    notes: string | null
    ingredients: { name: string; quantity: string | number; unit?: string }[]
}

export interface AffectedBatch {
    id: string
    name: string
    status: string
}

interface RecipeFormProps {
    availableIngredients: { id: string; name: string; unit: string; type: "BASE" | "STYLE" }[]
    recipe?: EditableRecipe
    affectedBatches?: AffectedBatch[]
    returnTo?: string
}

const initialState = {
    message: '',
}

export function RecipeForm({ availableIngredients, recipe, affectedBatches = [], returnTo }: RecipeFormProps) {
    const isEdit = Boolean(recipe)
    const action = isEdit ? updateRecipe : createRecipe
    const [state, formAction] = useActionState(action, initialState)

    const nextRowId = useRef(0)
    const makeRowId = () => `row-${++nextRowId.current}`

    const [ingredients, setIngredients] = useState<IngredientRow[]>(() => {
        if (recipe && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
            return recipe.ingredients.map((ing, idx) => ({
                _id: `init-${idx}`,
                name: ing.name || '',
                quantity: ing.quantity !== undefined && ing.quantity !== null ? String(ing.quantity) : '',
                unit: ing.unit || 'g',
            }))
        }
        return [{ _id: 'init-0', name: '', quantity: '', unit: 'g' }]
    })

    const [type, setType] = useState<"BASE" | "STYLE">(recipe?.type || "BASE")
    const [name, setName] = useState(recipe?.name || "")
    const [notes, setNotes] = useState(recipe?.notes || "")

    // AI State (create mode only)
    const [mood, setMood] = useState("")
    const [isGenerating, startTransition] = useTransition()
    const [aiError, setAiError] = useState("")

    const addIngredient = () => {
        setIngredients(prev => [...prev, { _id: makeRowId(), name: '', quantity: '', unit: 'g' }])
    }

    const removeIngredient = (rowId: string) => {
        setIngredients(prev => prev.filter(row => row._id !== rowId))
    }

    const updateIngredient = (rowId: string, updates: Partial<Omit<IngredientRow, '_id'>>) => {
        setIngredients(prev =>
            prev.map(row => (row._id === rowId ? { ...row, ...updates } : row))
        )
    }

    const handleGenerate = async () => {
        if (!mood.trim()) return

        setAiError("")
        startTransition(async () => {
            const result = await generateRecipe(mood)
            if (result.success && result.data) {
                setName(result.data.name)
                setNotes(result.data.notes)
                setType("STYLE")

                const newIngredients = result.data.ingredients.map((ing: any) => ({
                    _id: makeRowId(),
                    name: ing.name,
                    quantity: ing.quantity.toString(),
                    unit: ing.unit || 'g'
                }))
                setIngredients(newIngredients)
            } else {
                setAiError(result.error || "Failed to generate recipe")
            }
        })
    }

    const filteredIngredients = availableIngredients.filter(i => i.type === type)

    const totalWeight = ingredients.reduce((sum, ing) => {
        const qty = Number(ing.quantity)
        return sum + (isNaN(qty) ? 0 : qty)
    }, 0)

    const serializedIngredients = JSON.stringify(
        ingredients.map(({ name: ingName, quantity, unit }) => ({
            name: ingName,
            quantity,
            unit,
        }))
    )

    const cancelHref = returnTo || (recipe ? `/recipes/${recipe.id}` : '/admin/recipes')

    return (
        <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-border space-y-8">
            {/* Affected Batches Callout (Edit Mode) */}
            {isEdit && affectedBatches.length > 0 && (
                <div className="rounded-lg border border-brand-terracotta/25 bg-brand-terracotta-light/40 p-4 flex gap-3">
                    <Info className="h-5 w-5 text-brand-terracotta shrink-0 mt-0.5" />
                    <div className="text-sm text-brand-warm-brown space-y-1.5">
                        <p className="font-medium">
                            Used in {affectedBatches.length} {affectedBatches.length === 1 ? 'batch' : 'batches'}
                        </p>
                        <p className="text-xs text-brand-stone">
                            Changes to ingredients and amounts will automatically be reflected in:
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {affectedBatches.map((batch) => (
                                <Link
                                    key={batch.id}
                                    href={`/admin/batches/${batch.id}`}
                                    className="inline-flex items-center rounded-md bg-white/90 border border-brand-terracotta/20 px-2 py-0.5 text-xs font-medium text-brand-terracotta hover:bg-brand-terracotta hover:text-white transition-colors"
                                >
                                    {batch.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Generator Section (Create Mode only) */}
            {!isEdit && (
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-indigo-600">
                        <Sparkles className="w-4 h-4" /> AI Recipe Generator
                    </h3>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Describe your mood, feeling, or desired scent profile..."
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            className="bg-white"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                        />
                        <Button type="button" onClick={handleGenerate} disabled={isGenerating || !mood.trim()} variant="secondary">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
                        </Button>
                    </div>
                    {aiError && <p role="status" aria-live="polite" className="text-red-500 text-xs mt-2">{aiError}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                        Enter a mood (e.g., &quot;Calming forest walk&quot;, &quot;Energizing citrus morning&quot;) and AI will suggest a Style recipe from your inventory.
                    </p>
                </div>
            )}

            <form action={formAction} className="space-y-6">
                {recipe && <input type="hidden" name="id" value={recipe.id} />}
                {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

                <div>
                    <label htmlFor="recipe-name" className="block text-sm font-medium text-brand-warm-brown">
                        Recipe Name <span aria-hidden="true" className="text-brand-terracotta">*</span>
                    </label>
                    <Input
                        name="name"
                        id="recipe-name"
                        required
                        className="mt-1"
                        placeholder="e.g. Lavender scrub"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {isEdit ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-brand-warm-brown">Recipe Type:</span>
                        <Badge
                            variant={type === 'BASE' ? 'default' : 'secondary'}
                            className={type === 'BASE' ? 'bg-brand-warm-brown' : 'bg-brand-terracotta-light text-brand-terracotta'}
                        >
                            {type === 'BASE' ? 'Base Recipe (Oils & Lye)' : 'Style Recipe (Scents & Additives)'}
                        </Badge>
                    </div>
                ) : (
                    <fieldset className="space-y-2">
                        <legend className="block text-sm font-medium text-brand-warm-brown">Recipe Type</legend>
                        <div className="flex flex-wrap gap-4 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="BASE"
                                    checked={type === 'BASE'}
                                    onChange={() => setType('BASE')}
                                    className="h-4 w-4 border-gray-300 text-brand-terracotta focus:ring-brand-terracotta"
                                />
                                <span className="text-sm text-gray-700">Base Recipe (Oils &amp; Lye)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="STYLE"
                                    checked={type === 'STYLE'}
                                    onChange={() => setType('STYLE')}
                                    className="h-4 w-4 border-gray-300 text-brand-terracotta focus:ring-brand-terracotta"
                                />
                                <span className="text-sm text-gray-700">Style Recipe (Scents &amp; Additives)</span>
                            </label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Base recipes cover the main oils and lye solution. Style recipes cover essential oils, colorants, and other additives.
                        </p>
                    </fieldset>
                )}

                <fieldset className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <legend className="text-sm font-medium text-brand-warm-brown">
                            {type === 'STYLE' ? 'Essential Oils & Additives' : 'Ingredients'}
                        </legend>
                        <span className="text-xs text-brand-stone font-mono inline-flex items-center gap-1 bg-brand-cream px-2 py-0.5 rounded-md border border-border">
                            <Scale className="h-3 w-3 text-brand-terracotta" />
                            Total: {totalWeight.toFixed(1)}g
                        </span>
                    </div>

                    <div className="grid grid-cols-[1fr_5.5rem_4.5rem_2.25rem] gap-2 text-xs font-medium text-brand-stone px-0.5">
                        <span>{type === 'STYLE' ? 'Essential Oil / Additive' : 'Ingredient'}</span>
                        <span>Amount</span>
                        <span>Unit</span>
                        <span className="sr-only">Actions</span>
                    </div>

                    <div className="space-y-2.5">
                        {ingredients.map((ing, index) => (
                            <div key={ing._id} className="grid grid-cols-[1fr_5.5rem_4.5rem_2.25rem] gap-2 items-center">
                                <IngredientSelect
                                    value={ing.name}
                                    placeholder={type === 'STYLE' ? 'Select or add oil...' : 'Select ingredient...'}
                                    onChange={(val) => {
                                        const match = availableIngredients.find(
                                            i => i.name.toLowerCase() === val.toLowerCase()
                                        )
                                        const updates: Partial<Omit<IngredientRow, '_id'>> = { name: val }
                                        if (match && !ing.unit) {
                                            updates.unit = match.unit
                                        }
                                        updateIngredient(ing._id, updates)
                                    }}
                                    options={filteredIngredients}
                                />

                                <Input
                                    id={`ing-qty-${ing._id}`}
                                    aria-label={`Amount for ${ing.name || `ingredient ${index + 1}`}`}
                                    type="text"
                                    inputMode="decimal"
                                    enterKeyHint="next"
                                    placeholder="0"
                                    value={ing.quantity}
                                    onChange={(e) => updateIngredient(ing._id, { quantity: e.target.value })}
                                    required
                                    className="font-mono"
                                />
                                <Input
                                    id={`ing-unit-${ing._id}`}
                                    aria-label={`Unit for ${ing.name || `ingredient ${index + 1}`}`}
                                    placeholder="g"
                                    value={ing.unit}
                                    onChange={(e) => updateIngredient(ing._id, { unit: e.target.value })}
                                />
                                <div className="flex justify-center">
                                    {ingredients.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-brand-stone hover:text-destructive"
                                            onClick={() => removeIngredient(ing._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove {ing.name || `ingredient ${index + 1}`}</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIngredient}
                        className="mt-1 border-brand-terracotta/30 text-brand-terracotta hover:bg-brand-terracotta-light"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        {type === 'STYLE' ? 'Add Essential Oil / Additive' : 'Add Ingredient'}
                    </Button>

                    {/* Hidden input to submit the JSON string */}
                    <input type="hidden" name="ingredients" value={serializedIngredients} />
                </fieldset>

                <div>
                    <label htmlFor="recipe-notes" className="block text-sm font-medium text-brand-warm-brown">Notes</label>
                    <textarea
                        name="notes"
                        id="recipe-notes"
                        className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Any additional notes or substitution details..."
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {state?.message && (
                    <p role="status" aria-live="polite" className="text-red-600 text-sm font-medium">
                        {state.message}
                    </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                    <Button type="button" variant="outline" asChild>
                        <Link href={cancelHref}>Cancel</Link>
                    </Button>
                    <SubmitButton isEdit={isEdit} />
                </div>
            </form>
        </div>
    )
}

function IngredientSelect({
    value,
    onChange,
    options,
    placeholder = "Select available ingredient...",
}: {
    value: string
    onChange: (val: string) => void
    options: { name: string }[]
    placeholder?: string
}) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")

    const trimmedInput = inputValue.trim()
    const hasExactMatch = options.some(
        (opt) => opt.name.toLowerCase() === trimmedInput.toLowerCase()
    )

    const selectCustom = () => {
        if (!trimmedInput) return
        onChange(trimmedInput)
        setInputValue("")
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={(nextOpen) => {
            setOpen(nextOpen)
            if (!nextOpen) setInputValue("")
        }}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal overflow-hidden"
                >
                    <span className={cn("truncate", !value && "text-muted-foreground")}>
                        {value || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search or type a new oil..."
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-2">No matching ingredient found.</p>
                                {trimmedInput && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="w-full text-xs"
                                        onClick={selectCustom}
                                    >
                                        <Plus className="mr-2 h-3 w-3" />
                                        Add &quot;{trimmedInput}&quot;
                                    </Button>
                                )}
                            </div>
                        </CommandEmpty>
                        {trimmedInput && !hasExactMatch && (
                            <CommandGroup heading="New ingredient">
                                <CommandItem
                                    value={`__add_custom__${trimmedInput}`}
                                    onSelect={selectCustom}
                                >
                                    <Plus className="mr-2 h-4 w-4 text-brand-terracotta" />
                                    Add &quot;{trimmedInput}&quot;
                                </CommandItem>
                            </CommandGroup>
                        )}
                        <CommandGroup heading="Available">
                            {options.map((option) => (
                                <CommandItem
                                    key={option.name}
                                    value={option.name}
                                    onSelect={() => {
                                        onChange(option.name)
                                        setInputValue("")
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.name ? "opacity-100" : "opacity-0"
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

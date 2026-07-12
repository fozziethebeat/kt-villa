'use client'

import { useState, useActionState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, ChevronsUpDown, Beaker, Droplets, Scale, ListTodo } from 'lucide-react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBatch } from '@/app/actions/batch'
// @ts-ignore
import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} className="bg-brand-warm-brown hover:bg-brand-warm-brown/90 text-brand-cream">
            {pending ? 'Creating...' : 'Create Batch'}
        </Button>
    )
}

interface RecipeIngredient {
    name: string
    quantity: number | string
    unit: string
}

interface Recipe {
    id: string
    name: string
    type: string
    ingredients: any
    notes?: string | null
}

interface BatchFormProps {
    baseRecipes: Recipe[]
    styleRecipes: Recipe[]
}

const initialState = {
    message: '',
}

function IngredientChecklistCard({ recipe, title, icon, scale }: {
    recipe: Recipe
    title: string
    icon: React.ReactNode
    scale: number
}) {
    let ingredients = (recipe.ingredients as any) as RecipeIngredient[] || []
    if (recipe.type === "BASE") {
        ingredients = [
            ...ingredients,
            { name: "Water", quantity: 192, unit: "g" },
            { name: "Lye", quantity: 87, unit: "g" }
        ]
    }

    if (scale !== 1.0) {
        ingredients = ingredients.map(ing => {
            const rawQty = Number(ing.quantity)
            const scaledQty = isNaN(rawQty) ? ing.quantity : Math.ceil(rawQty * scale)
            return {
                ...ing,
                quantity: scaledQty
            }
        })
    }

    const totalWeight = ingredients.reduce((sum, ing) => sum + (Number(ing.quantity) || 0), 0)
    const [checked, setChecked] = useState<Record<string, boolean>>({})

    // Reset checked state when recipe changes
    useEffect(() => {
        setChecked({})
    }, [recipe.id])

    const toggleChecked = (name: string) => {
        setChecked(prev => ({
            ...prev,
            [name]: !prev[name]
        }))
    }

    return (
        <Card className="border-border">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-brand-warm-brown">
                        {icon}
                        {title}: {recipe.name}
                    </CardTitle>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-cream text-brand-stone flex items-center gap-1 font-mono">
                        <Scale className="w-3.5 h-3.5 text-brand-stone" />
                        {totalWeight.toFixed(1)}g
                    </span>
                </div>
                {recipe.notes && (
                    <CardDescription className="text-xs italic text-brand-stone mt-1">
                        &quot;{recipe.notes}&quot;
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <ul className="divide-y divide-border border border-border rounded-md overflow-hidden bg-brand-cream/10">
                    {ingredients.map((ing, idx) => {
                        const isChecked = !!checked[ing.name]
                        return (
                            <li
                                key={idx}
                                className={cn(
                                    "flex items-center justify-between p-3 transition-colors cursor-pointer select-none",
                                    isChecked ? "bg-brand-sage-light/20 text-brand-stone/60" : "hover:bg-brand-cream/35 text-brand-warm-brown"
                                )}
                                onClick={() => toggleChecked(ing.name)}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                        isChecked
                                            ? "border-brand-sage bg-brand-sage text-brand-cream"
                                            : "border-gray-300 bg-white"
                                    )}>
                                        {isChecked && (
                                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                                                <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-sm font-medium",
                                        isChecked && "line-through text-brand-stone/40 font-normal"
                                    )}>
                                        {ing.name}
                                    </span>
                                </div>
                                <span className={cn(
                                    "text-sm font-mono",
                                    isChecked ? "text-brand-stone/40" : "text-brand-stone"
                                )}>
                                    {ing.quantity} {ing.unit || 'g'}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </CardContent>
        </Card>
    )
}

function EmptyChecklistPlaceholder() {
    return (
        <Card className="border-dashed border-2 border-brand-terracotta/20 bg-brand-cream/10 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center mb-4">
                <ListTodo className="w-6 h-6 text-brand-terracotta/50" />
            </div>
            <h3 className="text-sm font-semibold text-brand-warm-brown">No Recipes Selected</h3>
            <p className="text-xs text-brand-stone max-w-xs mt-1 leading-relaxed">
                Select a base recipe and style recipe to generate your interactive ingredient checklist.
            </p>
        </Card>
    )
}

export function BatchForm({ baseRecipes, styleRecipes }: BatchFormProps) {
    const [state, formAction] = useActionState(createBatch, initialState)
    const [baseRecipeId, setBaseRecipeId] = useState("")
    const [styleRecipeId, setStyleRecipeId] = useState("")
    const [name, setName] = useState("")
    const [startedAt, setStartedAt] = useState(new Date().toISOString().split('T')[0])
    const [notes, setNotes] = useState("")
    const [moldSize, setMoldSize] = useState<"900" | "1300">("900")

    const scale = moldSize === "1300" ? 1.4 : 1.0

    const selectedBase = baseRecipes.find(r => r.id === baseRecipeId)
    const selectedStyle = styleRecipes.find(r => r.id === styleRecipeId)

    // Auto-generate name when recipes are selected
    const autoName = [selectedBase?.name, selectedStyle?.name].filter(Boolean).join(' + ')

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto items-start">
            {/* Form Column */}
            <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border space-y-6">
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

                    {/* Mold Size & Scaling */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 font-semibold">Mold Size & Scaling</label>
                        <input type="hidden" name="scale" value={scale} />
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setMoldSize("900")}
                                className={cn(
                                    "flex-1 py-2.5 px-4 rounded-md border text-sm font-medium transition-all cursor-pointer text-center",
                                    moldSize === "900"
                                        ? "border-brand-warm-brown bg-brand-cream/40 text-brand-warm-brown ring-2 ring-brand-warm-brown/10"
                                        : "border-border bg-white text-brand-stone hover:bg-brand-cream/15"
                                )}
                            >
                                <span className="block font-semibold">Standard (900ml)</span>
                                <span className="text-xs opacity-75">1.0x Scale</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMoldSize("1300")}
                                className={cn(
                                    "flex-1 py-2.5 px-4 rounded-md border text-sm font-medium transition-all cursor-pointer text-center",
                                    moldSize === "1300"
                                        ? "border-brand-warm-brown bg-brand-cream/40 text-brand-warm-brown ring-2 ring-brand-warm-brown/10"
                                        : "border-border bg-white text-brand-stone hover:bg-brand-cream/15"
                                )}
                            >
                                <span className="block font-semibold">Large (1300ml)</span>
                                <span className="text-xs opacity-75">1.4x Scale (ceil)</span>
                            </button>
                        </div>
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

            {/* Checklist Column */}
            <div className="lg:col-span-2 space-y-6">
                {!selectedBase && !selectedStyle && <EmptyChecklistPlaceholder />}
                {selectedBase && (
                    <IngredientChecklistCard
                        key={`base-${selectedBase.id}`}
                        recipe={selectedBase}
                        title="Base Recipe"
                        icon={<Beaker className="w-5 h-5 text-brand-terracotta" />}
                        scale={scale}
                    />
                )}
                {selectedStyle && (
                    <IngredientChecklistCard
                        key={`style-${selectedStyle.id}`}
                        recipe={selectedStyle}
                        title="Style Recipe"
                        icon={<Droplets className="w-5 h-5 text-brand-rose" />}
                        scale={scale}
                    />
                )}
            </div>
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

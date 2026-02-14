'use client'

import { useState, useActionState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, ChevronsUpDown, Plus, Sparkles, Loader2 } from 'lucide-react'
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
import { createRecipe } from '@/app/actions/recipe'
import { generateRecipe } from '@/app/actions/ai-recipe'
// @ts-ignore
import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Recipe'}
        </Button>
    )
}

interface Ingredient {
    name: string
    quantity: string
    unit?: string
}

interface RecipeFormProps {
    availableIngredients: { id: string; name: string; unit: string; type: "BASE" | "STYLE" }[]
}

const initialState = {
    message: '',
}

export function RecipeForm({ availableIngredients }: RecipeFormProps) {
    const [state, formAction] = useActionState(createRecipe, initialState)
    const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', quantity: '', unit: 'g' }])
    const [type, setType] = useState<"BASE" | "STYLE">("BASE")
    const [name, setName] = useState("")
    const [notes, setNotes] = useState("")

    // AI State
    const [mood, setMood] = useState("")
    const [isGenerating, startTransition] = useTransition()
    const [aiError, setAiError] = useState("")

    const addIngredient = () => {
        setIngredients([...ingredients, { name: '', quantity: '', unit: 'g' }])
    }

    const removeIngredient = (index: number) => {
        const newIngredients = [...ingredients]
        newIngredients.splice(index, 1)
        setIngredients(newIngredients)
    }

    const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
        const newIngredients = [...ingredients]
        // @ts-ignore
        newIngredients[index][field] = value
        setIngredients(newIngredients)
    }

    const handleGenerate = async () => {
        if (!mood.trim()) return

        setAiError("")
        startTransition(async () => {
            const result = await generateRecipe(mood)
            if (result.success && result.data) {
                setName(result.data.name)
                setNotes(result.data.notes)
                // Set type to STYLE as requested for generation usually
                setType("STYLE")

                // Map generated ingredients
                const newIngredients = result.data.ingredients.map((ing: any) => ({
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

    return (
        <div className="max-w-2xl bg-white p-6 rounded-lg shadow-sm border space-y-8">
            {/* AI Generator Section */}
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
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                    />
                    <Button onClick={handleGenerate} disabled={isGenerating || !mood.trim()} variant="secondary">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
                    </Button>
                </div>
                {aiError && <p className="text-red-500 text-xs mt-2">{aiError}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                    Enter a mood (e.g., "Calming forest walk", "Energizing citrus morning") and AI will suggest a Style recipe from your inventory.
                </p>
            </div>

            <form action={formAction} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Recipe Name</label>
                    <Input
                        name="name"
                        id="name"
                        required
                        className="mt-1"
                        placeholder="e.g. Lavender scrub"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Recipe Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="BASE"
                                checked={type === 'BASE'}
                                onChange={() => setType('BASE')}
                                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Base Recipe (Oils & Lye)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="STYLE"
                                checked={type === 'STYLE'}
                                onChange={() => setType('STYLE')}
                                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Style Recipe (Scents & Additives)</span>
                        </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Base recipes cover the main oils and lye solution. Style recipes cover essential oils, colorants, and other additives.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                    <div className="space-y-3">
                        {ingredients.map((ing, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <IngredientSelect
                                    value={ing.name}
                                    onChange={(val) => {
                                        updateIngredient(index, 'name', val)
                                        // Auto-set unit if available and not set
                                        const match = availableIngredients.find(i => i.name === val)
                                        if (match && !ing.unit) {
                                            updateIngredient(index, 'unit', match.unit)
                                        }
                                    }}
                                    options={filteredIngredients}
                                />
                                {/* Hidden input to ensure name is submitted if JS fails or for simplicity, though we use hidden JSON */}
                                <input type="hidden" name={`ing-name-${index}`} value={ing.name} />

                                <Input
                                    placeholder="Qty"
                                    value={ing.quantity}
                                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                                    required
                                    className="w-24"
                                />
                                <Input
                                    placeholder="Unit"
                                    value={ing.unit}
                                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                    className="w-24"
                                />
                                {ingredients.length > 1 && (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(index)}>
                                        <span className="sr-only">Remove</span>
                                        &times;
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="mt-2">
                        + Add Ingredient
                    </Button>
                    {/* Hidden input to submit the JSON string */}
                    <input type="hidden" name="ingredients" value={JSON.stringify(ingredients)} />
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                        name="notes"
                        id="notes"
                        className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Any additional notes..."
                        rows={3}
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

function IngredientSelect({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: { name: string }[] }) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="flex-1 justify-between font-normal"
                >
                    {value ? value : "Select available ingredient..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search ingredient..." onValueChange={setInputValue} />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-2">No ingredient found.</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => {
                                        onChange(inputValue)
                                        setOpen(false)
                                    }}
                                >
                                    <Plus className="mr-2 h-3 w-3" />
                                    Use "{inputValue}"
                                </Button>
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.name}
                                    value={option.name}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? "" : currentValue)
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

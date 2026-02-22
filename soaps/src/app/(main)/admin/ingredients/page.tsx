import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { IngredientRow } from './IngredientRow'

export default async function IngredientsPage() {
    const ingredients = await prisma.ingredient.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="container mx-auto py-10 px-4 md:px-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">Ingredients Inventory</h1>
                    <p className="text-brand-stone mt-2">
                        Manage your soap making ingredients and stock levels.
                    </p>
                </div>
                <Button asChild className="bg-brand-warm-brown hover:bg-brand-warm-brown/90 text-brand-cream">
                    <Link href="/admin/ingredients/new">
                        <Plus className="mr-2 h-4 w-4" /> Add Ingredient
                    </Link>
                </Button>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-brand-cream/50">
                    <h2 className="font-semibold text-lg text-brand-warm-brown">Current Stock</h2>
                    <Badge variant="secondary" className="ml-auto bg-brand-terracotta-light text-brand-terracotta border-brand-terracotta/15">{ingredients.length}</Badge>
                </div>

                {ingredients.length === 0 ? (
                    <div className="p-8 text-center text-brand-stone text-sm">
                        No ingredients found in inventory.
                    </div>
                ) : (
                    <div className="divide-y divide-border text-sm">
                        <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-brand-cream/30 text-xs font-medium text-brand-stone uppercase tracking-wider">
                            <div className="col-span-4">Name</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-3 text-right">Quantity</div>
                            <div className="col-span-3 pl-4">Notes</div>
                        </div>
                        {ingredients.map((ing) => (
                            <IngredientRow key={ing.id} ingredient={ing} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

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
                    <h1 className="text-3xl font-bold tracking-tight">Ingredients Inventory</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your soap making ingredients and stock levels.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/ingredients/new">
                        <Plus className="mr-2 h-4 w-4" /> Add Ingredient
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center gap-2 bg-muted/20">
                    <h2 className="font-semibold text-lg">Current Stock</h2>
                    <Badge variant="secondary" className="ml-auto">{ingredients.length}</Badge>
                </div>

                {ingredients.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        No ingredients found in inventory.
                    </div>
                ) : (
                    <div className="divide-y text-sm">
                        <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
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

import { RecipeForm } from './RecipeForm'
import prisma from '@/lib/prisma'

export default async function NewRecipePage() {
    const ingredients = await prisma.ingredient.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="container mx-auto py-10 px-4 md:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Create New Recipe</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new soap recipe to your collection.
                </p>
            </div>
            <RecipeForm availableIngredients={ingredients} />
        </div>
    )
}

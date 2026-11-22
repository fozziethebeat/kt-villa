import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Header } from '@/components/Header'
import { RecipeForm } from '../../new/RecipeForm'

const links = [
    { url: '/', label: 'Home' },
    { url: '/admin/recipes', label: 'Recipes' },
]

interface EditRecipePageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ from?: string }>
}

export default async function EditRecipePage({ params, searchParams }: EditRecipePageProps) {
    const { id } = await params
    const { from } = await searchParams

    const [recipe, ingredients] = await Promise.all([
        prisma.recipe.findUnique({
            where: { id },
            include: {
                baseBatches: {
                    select: { id: true, name: true, status: true },
                    orderBy: { startedAt: 'desc' },
                },
                styleBatches: {
                    select: { id: true, name: true, status: true },
                    orderBy: { startedAt: 'desc' },
                },
            },
        }),
        prisma.ingredient.findMany({
            orderBy: { name: 'asc' },
        }),
    ])

    if (!recipe) {
        notFound()
    }

    const affectedBatches = recipe.type === 'STYLE' ? recipe.styleBatches : recipe.baseBatches
    const safeReturnTo =
        from && from.startsWith('/') && !from.startsWith('//') ? from : undefined

    const recipeIngredients = Array.isArray(recipe.ingredients)
        ? (recipe.ingredients as { name: string; quantity: string | number; unit?: string }[])
        : []

    return (
        <>
            <Header links={links} target={`Edit ${recipe.name}`} />
            <div className="container mx-auto py-10 px-4 md:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">
                        Edit {recipe.type === 'STYLE' ? 'Style' : 'Base'} Recipe
                    </h1>
                    <p className="text-brand-stone mt-2">
                        Update ingredients, add substitutions, or adjust amounts. Changes are reflected in any batches using this recipe.
                    </p>
                </div>

                <RecipeForm
                    availableIngredients={ingredients}
                    recipe={{
                        id: recipe.id,
                        name: recipe.name,
                        type: recipe.type,
                        notes: recipe.notes,
                        ingredients: recipeIngredients,
                    }}
                    affectedBatches={affectedBatches}
                    returnTo={safeReturnTo}
                />
            </div>
        </>
    )
}

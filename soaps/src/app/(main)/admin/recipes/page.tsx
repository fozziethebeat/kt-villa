import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Plus, Beaker, Leaf } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function RecipesPage() {
    const recipes = await prisma.recipe.findMany({
        orderBy: { updatedAt: 'desc' }
    })

    const baseRecipes = recipes.filter(r => r.type === 'BASE')
    const styleRecipes = recipes.filter(r => r.type === 'STYLE')

    const RecipeList = ({ items, title, icon: Icon }: { items: typeof recipes, title: string, icon: any }) => (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-brand-cream/50">
                <Icon className="h-5 w-5 text-brand-terracotta" />
                <h2 className="font-semibold text-lg text-brand-warm-brown">{title}</h2>
                <Badge variant="secondary" className="ml-auto bg-brand-terracotta-light text-brand-terracotta border-brand-terracotta/15">{items.length}</Badge>
            </div>
            {items.length === 0 ? (
                <div className="p-8 text-center text-brand-stone text-sm">
                    No {title.toLowerCase()} found.
                </div>
            ) : (
                <div className="divide-y divide-border text-sm">
                    <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-brand-cream/30 text-xs font-medium text-brand-stone uppercase tracking-wider">
                        <div className="col-span-4">Name</div>
                        <div className="col-span-6">Ingredients</div>
                        <div className="col-span-2 text-right">Updated</div>
                    </div>
                    {items.map((recipe) => {
                        const ingredients = Array.isArray(recipe.ingredients)
                            ? recipe.ingredients
                            : []

                        const summary = (ingredients as any[]).map(i => i.name).slice(0, 3).join(', ') +
                            ((ingredients as any[]).length > 3 ? '...' : '')

                        return (
                            <Link href={`/recipes/${recipe.id}`} key={recipe.id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-brand-cream/30 transition-colors block">
                                <div className="col-span-4 font-medium truncate text-brand-warm-brown">
                                    {recipe.name}
                                </div>
                                <div className="col-span-6 text-brand-stone truncate">
                                    {summary || <span className="opacity-50 italic">No ingredients</span>}
                                </div>
                                <div className="col-span-2 text-right text-brand-stone">
                                    {recipe.updatedAt.toLocaleDateString()}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )

    return (
        <div className="container mx-auto py-10 px-4 md:px-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">Recipes</h1>
                    <p className="text-brand-stone mt-2">
                        Manage your soap recipes.
                    </p>
                </div>
                <Button asChild className="bg-brand-warm-brown hover:bg-brand-warm-brown/90 text-brand-cream">
                    <Link href="/admin/recipes/new">
                        <Plus className="mr-2 h-4 w-4" /> New Recipe
                    </Link>
                </Button>
            </div>

            <RecipeList items={baseRecipes} title="Base Recipes" icon={Beaker} />
            <RecipeList items={styleRecipes} title="Style Recipes" icon={Leaf} />
        </div>
    )
}

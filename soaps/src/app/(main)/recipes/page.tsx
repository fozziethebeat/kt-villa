import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Beaker, Leaf } from 'lucide-react'

// Define the shape of an ingredient in the JSON structure
interface RecipeIngredient {
    name: string;
    quantity: number;
    unit: string;
}

export default async function RecipesPage() {
    const recipes = await prisma.recipe.findMany({
        orderBy: { updatedAt: 'desc' }
    })

    const baseRecipes = recipes.filter(r => r.type === 'BASE')
    const styleRecipes = recipes.filter(r => r.type === 'STYLE')

    return (
        <div className="container mx-auto py-10 px-4 md:px-8">
            <h1 className="text-3xl font-semibold tracking-tight mb-2 text-brand-warm-brown">Our Recipes</h1>
            <p className="text-brand-stone mb-8">
                Browse the collection of soap recipes.
            </p>

            <div className="space-y-12">
                <RecipeSection
                    title="Base Recipes"
                    icon={Beaker}
                    recipes={baseRecipes}
                    description="Foundational recipes for your soap batches."
                />

                <RecipeSection
                    title="Style Recipes"
                    icon={Leaf}
                    recipes={styleRecipes}
                    description="Scent profiles and additive blends."
                />
            </div>
        </div>
    )
}

function RecipeSection({ title, icon: Icon, recipes, description }: { title: string, icon: any, recipes: any[], description: string }) {
    if (recipes.length === 0) return null;

    return (
        <section>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-brand-terracotta-light rounded-full text-brand-terracotta">
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-brand-warm-brown">{title}</h2>
                    <p className="text-sm text-brand-stone">{description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                    <Link href={`/recipes/${recipe.id}`} key={recipe.id} className="block transition-transform hover:-translate-y-1">
                        <Card className="h-full hover:shadow-md transition-shadow border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex justify-between items-start gap-2 text-brand-warm-brown">
                                    <span className="truncate">{recipe.name}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-sm text-brand-stone line-clamp-2 min-h-[2.5em]">
                                        {recipe.notes || "No notes provided."}
                                    </div>

                                    <div className="flex flex-wrap gap-1">
                                        {(recipe.ingredients as unknown as RecipeIngredient[]).slice(0, 4).map((ing, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs font-normal bg-brand-cream text-brand-stone border-brand-terracotta/10">
                                                {ing.name}
                                            </Badge>
                                        ))}
                                        {(recipe.ingredients as unknown as RecipeIngredient[]).length > 4 && (
                                            <Badge variant="secondary" className="text-xs font-normal bg-brand-cream text-brand-stone">
                                                +{(recipe.ingredients as unknown as RecipeIngredient[]).length - 4} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    )
}

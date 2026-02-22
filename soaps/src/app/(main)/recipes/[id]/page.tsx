import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarDays, Scale } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface RecipeIngredient {
    name: string;
    quantity: number;
    unit: string;
}

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function RecipeDetailPage({ params }: PageProps) {
    const { id } = await params

    const recipe = await prisma.recipe.findUnique({
        where: { id }
    })

    if (!recipe) {
        notFound()
    }

    const isBase = recipe.type === "BASE"
    const ingredients = recipe.ingredients as unknown as RecipeIngredient[]

    // Calculate total weight
    const totalWeight = ingredients.reduce((sum, ing) => sum + (Number(ing.quantity) || 0), 0)

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-4xl">
            <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant={isBase ? "default" : "secondary"} className={isBase ? "bg-brand-warm-brown" : "bg-brand-terracotta-light text-brand-terracotta"}>
                            {isBase ? "Base Recipe" : "Style Recipe"}
                        </Badge>
                        <span className="text-sm text-brand-stone flex items-center gap-1">
                            <CalendarDays className="w-4 h-4" />
                            Updated {formatDate(recipe.updatedAt)}
                        </span>
                    </div>
                    <h1 className="text-4xl font-semibold tracking-tight mb-4 text-brand-warm-brown">{recipe.name}</h1>
                    {recipe.notes && (
                        <p className="text-lg text-brand-stone leading-relaxed italic">
                            &quot;{recipe.notes}&quot;
                        </p>
                    )}
                </div>

                <div className="flex gap-2">
                    {/* Add edit link if admin later */}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-brand-warm-brown">
                                <Scale className="w-5 h-5" />
                                Ingredients
                            </CardTitle>
                            <CardDescription className="text-brand-stone">
                                Total weight: {totalWeight.toFixed(1)}g
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <ul className="divide-y border border-border rounded-md">
                                    {ingredients.map((ingredient, index) => (
                                        <li key={index} className="flex justify-between items-center p-3 hover:bg-brand-cream/50 transition-colors first:rounded-t-md last:rounded-b-md">
                                            <span className="font-medium text-brand-warm-brown">{ingredient.name}</span>
                                            <span className="text-brand-stone font-mono">
                                                {ingredient.quantity} {ingredient.unit || 'g'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    {/* Placeholder for future features like scaling, cost calculation, etc. */}
                </div>
            </div>
        </div>
    )
}

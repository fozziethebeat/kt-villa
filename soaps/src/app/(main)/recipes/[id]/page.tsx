import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Scale, Edit } from "lucide-react"
import Link from "next/link"

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

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-4xl">
            <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant={isBase ? "default" : "secondary"}>
                            {isBase ? "Base Recipe" : "Style Recipe"}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="w-4 h-4" />
                            Updated {recipe.updatedAt.toLocaleDateString()}
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-4">{recipe.name}</h1>
                    {recipe.notes && (
                        <p className="text-lg text-muted-foreground leading-relaxed italic">
                            "{recipe.notes}"
                        </p>
                    )}
                </div>

                <div className="flex gap-2">
                    {/* Add edit link if admin later */}
                    {/* <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/recipes/${recipe.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                    </Button> */}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Scale className="w-5 h-5" />
                                Ingredients
                            </CardTitle>
                            <CardDescription>
                                Total weight: {(recipe.ingredients as any[]).reduce((sum, ing) => sum + parseFloat(ing.quantity || 0), 0).toFixed(1)}g
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <ul className="divide-y border rounded-md">
                                    {(recipe.ingredients as any[]).map((ingredient: any, index: number) => (
                                        <li key={index} className="flex justify-between items-center p-3 hover:bg-muted/50 transition-colors first:rounded-t-md last:rounded-b-md">
                                            <span className="font-medium text-gray-900">{ingredient.name}</span>
                                            <span className="text-muted-foreground font-mono">
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
                    {/* <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Type</span>
                                <span className="font-medium">{recipe.type || "N/A"}</span>
                            </div>
                        </CardContent>
                    </Card> */}
                </div>
            </div>
        </div>
    )
}

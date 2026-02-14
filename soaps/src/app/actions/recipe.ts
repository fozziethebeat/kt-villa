'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createRecipe(prevState: any, formData: FormData) {
    const name = formData.get("name") as string
    const type = formData.get("type") as "BASE" | "STYLE"
    const notes = formData.get("notes") as string

    const ingredientsJson = formData.get("ingredients") as string
    let parsedIngredients = []
    try {
        parsedIngredients = JSON.parse(ingredientsJson)
    } catch (e) {
        return { message: "Invalid ingredients format" }
    }

    if (!name) {
        return { message: "Name is required" }
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Upsert ingredients for inventory tracking
            for (const ing of parsedIngredients) {
                if (ing.name && ing.name.trim() !== '') {
                    await tx.ingredient.upsert({
                        where: { name: ing.name },
                        update: {
                            // Optionally update unit if not set or just touch updated at
                        },
                        create: {
                            name: ing.name,
                            unit: ing.unit || 'g',
                            quantity: 0,
                            type: type || 'BASE'
                        }
                    })
                }
            }

            await tx.recipe.create({
                data: {
                    name,
                    type: type || "BASE",
                    notes,
                    ingredients: parsedIngredients
                }
            })
        })
    } catch (error) {
        console.error(error)
        return { message: "Failed to create recipe" }
    }

    revalidatePath("/admin/recipes")
    redirect("/admin/recipes")
}

export async function deleteRecipe(id: string) {
    try {
        await prisma.recipe.delete({
            where: { id }
        })
        revalidatePath("/admin/recipes")
    } catch (error) {
        console.error("Failed to delete recipe", error)
    }
}

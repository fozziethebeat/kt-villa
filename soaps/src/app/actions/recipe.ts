'use server'

import prisma from "@/lib/prisma"
import { hasRole } from "@/lib/auth-check"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

interface RawIngredient {
    name?: string
    quantity?: string | number
    unit?: string
}

interface NormalizedIngredient {
    name: string
    quantity: string
    unit: string
}

function parseAndValidateIngredients(ingredientsJson: string | null): {
    ingredients?: NormalizedIngredient[]
    error?: string
} {
    if (!ingredientsJson) {
        return { error: "At least one ingredient is required" }
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(ingredientsJson)
    } catch {
        return { error: "Invalid ingredients format" }
    }

    if (!Array.isArray(parsed)) {
        return { error: "Invalid ingredients format" }
    }

    const normalized: NormalizedIngredient[] = []
    for (const item of parsed as RawIngredient[]) {
        const name = typeof item?.name === "string" ? item.name.trim() : ""
        const quantity =
            item?.quantity !== undefined && item?.quantity !== null
                ? String(item.quantity).trim()
                : ""
        const unit =
            typeof item?.unit === "string" && item.unit.trim() !== ""
                ? item.unit.trim()
                : "g"

        // Skip completely empty rows
        if (!name && !quantity) {
            continue
        }

        if (!name) {
            return { error: "Every ingredient row must have an ingredient name" }
        }

        if (!quantity) {
            return { error: `Please enter an amount for "${name}"` }
        }

        const numericQty = Number(quantity)
        if (isNaN(numericQty) || numericQty <= 0) {
            return { error: `Amount for "${name}" must be a positive number` }
        }

        normalized.push({ name, quantity, unit })
    }

    if (normalized.length === 0) {
        return { error: "Please add at least one ingredient" }
    }

    return { ingredients: normalized }
}

function getSafeReturnPath(returnTo: string | null, fallback: string): string {
    if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
        return returnTo
    }
    return fallback
}

export async function createRecipe(prevState: any, formData: FormData) {
    const isAdmin = await hasRole(["admin"])
    if (!isAdmin) {
        return { message: "Unauthorized" }
    }

    const name = (formData.get("name") as string | null)?.trim() || ""
    const type = (formData.get("type") as "BASE" | "STYLE" | null) || "BASE"
    const notes = (formData.get("notes") as string | null)?.trim() || null

    if (!name) {
        return { message: "Name is required" }
    }

    const { ingredients: parsedIngredients, error } = parseAndValidateIngredients(
        formData.get("ingredients") as string | null
    )
    if (error || !parsedIngredients) {
        return { message: error || "Invalid ingredients" }
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Upsert ingredients for inventory tracking
            for (const ing of parsedIngredients) {
                await tx.ingredient.upsert({
                    where: { name: ing.name },
                    update: {},
                    create: {
                        name: ing.name,
                        unit: ing.unit || "g",
                        quantity: 0,
                        type,
                    },
                })
            }

            await tx.recipe.create({
                data: {
                    name,
                    type,
                    notes,
                    ingredients: parsedIngredients as any,
                },
            })
        })
    } catch (error) {
        console.error(error)
        return { message: "Failed to create recipe" }
    }

    revalidatePath("/admin/recipes")
    revalidatePath("/recipes")
    revalidatePath("/")
    redirect("/admin/recipes")
}

export async function updateRecipe(prevState: any, formData: FormData) {
    const isAdmin = await hasRole(["admin"])
    if (!isAdmin) {
        return { message: "Unauthorized" }
    }

    const id = (formData.get("id") as string | null)?.trim() || ""
    const name = (formData.get("name") as string | null)?.trim() || ""
    const notes = (formData.get("notes") as string | null)?.trim() || null
    const returnTo = formData.get("returnTo") as string | null

    if (!id) {
        return { message: "Recipe ID is required" }
    }

    if (!name) {
        return { message: "Name is required" }
    }

    const { ingredients: parsedIngredients, error } = parseAndValidateIngredients(
        formData.get("ingredients") as string | null
    )
    if (error || !parsedIngredients) {
        return { message: error || "Invalid ingredients" }
    }

    let affectedBatchIds: string[] = []

    try {
        const existingRecipe = await prisma.recipe.findUnique({
            where: { id },
            include: {
                baseBatches: { select: { id: true } },
                styleBatches: { select: { id: true } },
            },
        })

        if (!existingRecipe) {
            return { message: "Recipe not found" }
        }

        affectedBatchIds = [
            ...existingRecipe.baseBatches.map((b) => b.id),
            ...existingRecipe.styleBatches.map((b) => b.id),
        ]

        await prisma.$transaction(async (tx) => {
            // Upsert any newly added ingredients for inventory tracking
            for (const ing of parsedIngredients) {
                await tx.ingredient.upsert({
                    where: { name: ing.name },
                    update: {},
                    create: {
                        name: ing.name,
                        unit: ing.unit || "g",
                        quantity: 0,
                        type: existingRecipe.type,
                    },
                })
            }

            await tx.recipe.update({
                where: { id },
                data: {
                    name,
                    notes,
                    ingredients: parsedIngredients as any,
                },
            })
        })
    } catch (error) {
        console.error(error)
        return { message: "Failed to update recipe" }
    }

    revalidatePath("/admin/recipes")
    revalidatePath(`/admin/recipes/${id}/edit`)
    revalidatePath("/recipes")
    revalidatePath(`/recipes/${id}`)
    revalidatePath("/admin/batches")
    revalidatePath("/")
    revalidatePath("/collection")

    for (const batchId of affectedBatchIds) {
        revalidatePath(`/admin/batches/${batchId}`)
        revalidatePath(`/batches/${batchId}`)
    }

    redirect(getSafeReturnPath(returnTo, `/recipes/${id}`))
}

export async function deleteRecipe(id: string) {
    const isAdmin = await hasRole(["admin"])
    if (!isAdmin) {
        return
    }

    try {
        await prisma.recipe.delete({
            where: { id }
        })
        revalidatePath("/admin/recipes")
        revalidatePath("/recipes")
        revalidatePath("/")
    } catch (error) {
        console.error("Failed to delete recipe", error)
    }
}

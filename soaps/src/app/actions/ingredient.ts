'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { RecipeType } from '@/lib/generated/prisma'
import { z } from 'zod'

const ingredientSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    quantity: z.coerce.number().min(0, 'Quantity must be non-negative'),
    unit: z.string().default('g'),
    type: z.nativeEnum(RecipeType).default(RecipeType.BASE), // Default to BASE if not provided
    notes: z.string().optional(),
})

export type IngredientState = {
    error?: {
        name?: string[]
        quantity?: string[]
        unit?: string[]
        type?: string[]
        notes?: string[]
        _form?: string[]
    }
}

export async function createIngredient(prevState: IngredientState, formData: FormData): Promise<IngredientState> {
    const rawData = {
        name: formData.get('name'),
        quantity: formData.get('quantity'),
        unit: formData.get('unit'),
        type: formData.get('type'),
        notes: formData.get('notes'),
    }

    const result = ingredientSchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.flatten().fieldErrors }
    }

    const { name, quantity, unit, type, notes } = result.data

    try {
        await prisma.ingredient.create({
            data: {
                name,
                quantity,
                unit,
                type,
                notes,
            },
        })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: { name: ['Ingredient with this name already exists'] } }
        }
        return { error: { _form: ['Failed to create ingredient'] } }
    }

    revalidatePath('/admin/ingredients')
    redirect('/admin/ingredients')
}

const updateQuantitySchema = z.object({
    id: z.string().min(1, 'ID is required'),
    quantity: z.coerce.number().min(0, 'Quantity must be non-negative'),
})

export type UpdateQuantityState = {
    success?: boolean
    error?: {
        id?: string[]
        quantity?: string[]
        _form?: string[]
    }
}

export async function updateIngredientQuantity(prevState: UpdateQuantityState, formData: FormData): Promise<UpdateQuantityState> {
    const rawData = {
        id: formData.get('id'),
        quantity: formData.get('quantity'),
    }

    const result = updateQuantitySchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.flatten().fieldErrors }
    }

    const { id, quantity } = result.data

    try {
        await prisma.ingredient.update({
            where: { id },
            data: { quantity },
        })
    } catch (error: any) {
        return { error: { _form: ['Failed to update quantity'] } }
    }

    revalidatePath('/admin/ingredients')
    return { success: true }
}

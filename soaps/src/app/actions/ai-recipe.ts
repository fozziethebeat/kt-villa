'use server';

import prisma from "@/lib/prisma";
import { generateRecipeSuggestion } from "@/lib/ai-recipe-generator";

export async function getInventory() {
    const inventory = await prisma.ingredient.findMany({
        orderBy: {
            quantity: 'desc'
        }
    });

    return inventory;
}

export async function generateRecipe(mood: string) {
    const inventory = await getInventory();

    if (!inventory) {
        throw new Error('No inventory available to generate recipe.');
    }

    try {
        const suggestion = await generateRecipeSuggestion(mood, inventory);
        return {
            success: true,
            data: suggestion
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: 'Failed to generate recipe. Please verify your API key and try again.'
        }
    }
}

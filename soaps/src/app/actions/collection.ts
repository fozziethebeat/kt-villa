'use server'

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

export async function addToCollection(magicCode: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        return { message: "Not authenticated", success: false }
    }

    const trimmedCode = magicCode.trim()
    if (!trimmedCode) {
        return { message: "Please enter a soap code.", success: false }
    }

    try {
        // Find the batch associated with this magic code
        const batch = await prisma.batch.findFirst({
            where: { magicCodeId: trimmedCode },
            include: { styleRecipe: true, baseRecipe: true }
        })

        if (!batch) {
            return { message: "Invalid soap code. Please check and try again.", success: false }
        }

        // Check if user already has this soap in their collection
        const existingGift = await prisma.soapGift.findFirst({
            where: {
                batchId: batch.id,
                userId: session.user.id,
            }
        })

        if (existingGift) {
            return { message: "This soap is already in your collection!", success: false }
        }

        // Add the soap to user's collection
        await prisma.soapGift.create({
            data: {
                batchId: batch.id,
                userId: session.user.id,
                note: `Added via code: ${trimmedCode}`,
            }
        })

        revalidatePath("/collection")
        return {
            message: `Added "${batch.name}" to your collection!`,
            success: true,
            batchName: batch.name,
        }
    } catch (error) {
        console.error("Failed to add soap to collection:", error)
        return { message: "Something went wrong. Please try again.", success: false }
    }
}

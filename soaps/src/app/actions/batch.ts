'use server'

import prisma from "@/lib/prisma"
import { imageGenerator } from "@/lib/generate"
import { generateMagicCode } from "@/lib/utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createBatch(prevState: any, formData: FormData) {
    const name = formData.get("name") as string
    const baseRecipeId = formData.get("baseRecipeId") as string
    const styleRecipeId = formData.get("styleRecipeId") as string
    const startedAt = formData.get("startedAt") as string
    const notes = formData.get("notes") as string

    if (!name) {
        return { message: "Batch name is required" }
    }
    if (!baseRecipeId) {
        return { message: "A base recipe is required" }
    }
    if (!startedAt) {
        return { message: "Start date is required" }
    }

    try {
        // Generate a unique magic code for this batch
        const magicCodeId = generateMagicCode()
        await prisma.magicCode.create({ data: { id: magicCodeId } })

        const batch = await prisma.batch.create({
            data: {
                name,
                baseRecipeId,
                styleRecipeId: styleRecipeId || null,
                startedAt: new Date(startedAt),
                notes: notes || null,
                status: "STARTED",
                magicCodeId,
            }
        })

        revalidatePath("/admin/batches")
        redirect(`/admin/batches/${batch.id}`)
    } catch (error: any) {
        // redirect throws a special error, re-throw it
        if (error?.digest?.startsWith("NEXT_REDIRECT")) {
            throw error
        }
        console.error(error)
        return { message: "Failed to create batch" }
    }
}

export async function updateBatch(prevState: any, formData: FormData) {
    const id = formData.get("id") as string
    const notes = formData.get("notes") as string | null
    const numBarsStr = formData.get("numBars") as string | null
    const status = formData.get("status") as string | null

    if (!id) {
        return { message: "Batch ID is required" }
    }

    const data: any = {}
    if (notes !== null) data.notes = notes
    if (numBarsStr !== null && numBarsStr !== "") {
        const numBars = parseInt(numBarsStr, 10)
        if (isNaN(numBars) || numBars < 0) {
            return { message: "Number of bars must be a positive number" }
        }
        data.numBars = numBars
    }
    if (status) data.status = status

    try {
        await prisma.batch.update({
            where: { id },
            data,
        })
    } catch (error) {
        console.error(error)
        return { message: "Failed to update batch" }
    }

    revalidatePath(`/admin/batches/${id}`)
    revalidatePath("/admin/batches")
    return { message: "", success: true }
}

export async function generateBatchImage(batchId: string, prompt: string) {
    if (!batchId || !prompt) {
        return { error: "Batch ID and prompt are required" }
    }

    try {
        // Determine the next version number for this batch
        const lastImage = await prisma.batchImage.findFirst({
            where: { batchId },
            orderBy: { version: 'desc' },
        })
        const nextVersion = (lastImage?.version ?? 0) + 1

        // Use a versioned key so we never overwrite prior images
        const versionedId = `${batchId}_v${nextVersion}`
        const imageUrl = await imageGenerator.generateImage(versionedId, prompt)

        // Save the image record and set it as the active batch image
        await prisma.$transaction([
            prisma.batchImage.create({
                data: {
                    batchId,
                    imageUrl,
                    prompt,
                    version: nextVersion,
                },
            }),
            prisma.batch.update({
                where: { id: batchId },
                data: { imageUrl },
            }),
        ])

        revalidatePath(`/admin/batches/${batchId}`)
        revalidatePath("/admin/batches")
        return { success: true, imageUrl }
    } catch (error) {
        console.error("Image generation failed:", error)
        return { error: "Failed to generate image. Please try again." }
    }
}

export async function selectBatchImage(batchId: string, batchImageId: string) {
    if (!batchId || !batchImageId) {
        return { error: "Batch ID and Image ID are required" }
    }

    try {
        const batchImage = await prisma.batchImage.findUnique({
            where: { id: batchImageId },
        })

        if (!batchImage || batchImage.batchId !== batchId) {
            return { error: "Image not found for this batch" }
        }

        await prisma.batch.update({
            where: { id: batchId },
            data: { imageUrl: batchImage.imageUrl },
        })

        revalidatePath(`/admin/batches/${batchId}`)
        revalidatePath("/admin/batches")
        return { success: true, imageUrl: batchImage.imageUrl }
    } catch (error) {
        console.error("Failed to select batch image:", error)
        return { error: "Failed to select image. Please try again." }
    }
}

export async function deleteBatch(id: string) {
    try {
        await prisma.batch.delete({
            where: { id }
        })
        revalidatePath("/admin/batches")
    } catch (error) {
        console.error("Failed to delete batch", error)
    }
    redirect("/admin/batches")
}

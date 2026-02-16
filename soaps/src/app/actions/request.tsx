'use server'

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { mailer } from "@/lib/mailer"
import { checkAccess } from "@/lib/auth-check"

export async function requestBatch(styleRecipeId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        return { message: "Not authenticated", success: false }
    }

    try {
        // Check if user already has a pending request for this style
        const existingRequest = await prisma.batchRequest.findFirst({
            where: {
                userId: session.user.id,
                styleRecipeId: styleRecipeId,
                status: 'PENDING'
            }
        })

        if (existingRequest) {
            return { message: "You already have a pending request for this style.", success: false }
        }

        const recipe = await prisma.recipe.findUnique({
            where: { id: styleRecipeId }
        })

        if (!recipe) {
            return { message: "Recipe not found.", success: false }
        }

        // Create the request
        await prisma.batchRequest.create({
            data: {
                userId: session.user.id,
                styleRecipeId: styleRecipeId,
                status: 'PENDING'
            }
        })

        // Send notification email to admin
        const adminEmail = process.env.MAILER_FROM || "admin@example.com"

        try {
            await mailer.sendMail({
                from: process.env.MAILER_FROM,
                to: adminEmail,
                subject: `New Soap Request: ${recipe.name}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h1>New Batch Request</h1>
                        <p><strong>User:</strong> ${session.user.name || 'Unknown'} (${session.user.email})</p>
                        <p><strong>Requested Style:</strong> ${recipe.name}</p>
                        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/batches">Manage Batches</a></p>
                    </div>
                `
            })
        } catch (emailError) {
            console.error("Failed to send notification email:", emailError)
        }

        revalidatePath("/")
        revalidatePath("/admin/batches")

        return { message: "Request sent successfully!", success: true }
    } catch (error) {
        console.error("Failed to create batch request:", error)
        return { message: "Failed to send request.", success: false }
    }
}

export async function acceptRequest(requestId: string) {
    await checkAccess('admin', '/')

    try {
        // Fetch the request with its style recipe
        const request = await prisma.batchRequest.findUnique({
            where: { id: requestId },
            include: { styleRecipe: true, user: true }
        })

        if (!request) {
            return { message: "Request not found.", success: false }
        }

        // Find a default base recipe to use
        const baseRecipe = await prisma.recipe.findFirst({
            where: { type: 'BASE' }
        })

        if (!baseRecipe) {
            return { message: "No base recipe available. Create a base recipe first.", success: false }
        }

        // Create a new batch in SCHEDULING status and mark request as FULFILLED
        await prisma.$transaction([
            prisma.batch.create({
                data: {
                    name: `${request.styleRecipe.name} (Requested by ${request.user.name || request.user.email})`,
                    baseRecipeId: baseRecipe.id,
                    styleRecipeId: request.styleRecipeId,
                    startedAt: new Date(),
                    status: 'SCHEDULING',
                }
            }),
            prisma.batchRequest.update({
                where: { id: requestId },
                data: { status: 'FULFILLED' }
            })
        ])

        revalidatePath("/admin/batches")
        return { message: "Request accepted and batch scheduled.", success: true }
    } catch (error) {
        console.error("Failed to accept request:", error)
        return { message: "Failed to accept request.", success: false }
    }
}

export async function rejectRequest(requestId: string) {
    await checkAccess('admin', '/')

    try {
        await prisma.batchRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        })

        revalidatePath("/admin/batches")
        return { message: "Request rejected.", success: true }
    } catch (error) {
        console.error("Failed to reject request:", error)
        return { message: "Failed to reject request.", success: false }
    }
}

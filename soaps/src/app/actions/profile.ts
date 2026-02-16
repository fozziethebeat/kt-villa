'use server'

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { imageSaver } from "@/lib/storage"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

export async function updateProfile(prevState: any, formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        return { message: "Not authenticated" }
    }

    const name = formData.get("name") as string
    const avatarFile = formData.get("avatar") as File | null

    const data: any = {}

    if (name && name.trim().length > 0) {
        data.name = name.trim()
    }

    if (avatarFile && avatarFile.size > 0 && avatarFile.name !== "undefined") {
        if (!avatarFile.type.startsWith("image/")) {
            return { message: "File must be an image" }
        }

        if (avatarFile.size > 1 * 1024 * 1024) { // 1MB limit
            return { message: "Image must be less than 1MB" }
        }

        try {
            const buffer = Buffer.from(await avatarFile.arrayBuffer())
            const extension = avatarFile.type.split('/')[1] || 'png'
            const filename = `avatars/${session.user.id}-${Date.now()}.${extension}`

            const imageUrl = await imageSaver.uploadImage(
                buffer,
                filename,
                avatarFile.type
            )

            data.image = imageUrl
        } catch (error) {
            console.error("Failed to upload image:", error)
            return { message: "Failed to upload image. Please try again." }
        }
    }

    if (Object.keys(data).length === 0) {
        return { message: "No changes to save" }
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data,
        })

        revalidatePath("/profile")
        revalidatePath("/") // Update header/sidebar avatar
        return { message: "Profile updated successfully", success: true }
    } catch (error) {
        console.error("Failed to update profile:", error)
        return { message: "Failed to update profile" }
    }
}

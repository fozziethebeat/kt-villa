'use server'

import prisma from "@/lib/prisma"
import { generateMagicCode } from "@/lib/utils"
import { checkAccess } from "@/lib/auth-check"
import { revalidatePath } from "next/cache"

export async function createJoinCode(label: string) {
    await checkAccess('admin', '/')

    if (!label || !label.trim()) {
        return { message: "A label is required", success: false }
    }

    try {
        const code = generateMagicCode()
        await prisma.magicCode.create({
            data: {
                id: code,
                label: label.trim(),
                type: 'JOIN',
                active: true,
            }
        })

        revalidatePath('/admin/join-codes')
        return { message: "Join code created!", success: true, code }
    } catch (error) {
        console.error("Failed to create join code:", error)
        return { message: "Failed to create join code.", success: false }
    }
}

export async function toggleJoinCode(codeId: string, active: boolean) {
    await checkAccess('admin', '/')

    try {
        await prisma.magicCode.update({
            where: { id: codeId },
            data: { active },
        })

        revalidatePath('/admin/join-codes')
        return { message: active ? "Code activated" : "Code deactivated", success: true }
    } catch (error) {
        console.error("Failed to toggle join code:", error)
        return { message: "Failed to update code.", success: false }
    }
}

export async function deleteJoinCode(codeId: string) {
    await checkAccess('admin', '/')

    try {
        await prisma.magicCode.delete({
            where: { id: codeId },
        })

        revalidatePath('/admin/join-codes')
        return { message: "Code deleted", success: true }
    } catch (error) {
        console.error("Failed to delete join code:", error)
        return { message: "Failed to delete code.", success: false }
    }
}

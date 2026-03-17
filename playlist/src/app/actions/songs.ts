'use server'

import prisma from "@/lib/prisma"
import { checkAccess } from "@/lib/auth-check"
import { revalidatePath } from "next/cache"

export async function createSong(formData: FormData) {
    await checkAccess('admin', '/')

    const title = formData.get('title') as string
    const artist = formData.get('artist') as string
    const albumArt = formData.get('albumArt') as string || null
    const spotifyUrl = formData.get('spotifyUrl') as string || null

    if (!title?.trim() || !artist?.trim()) {
        return { message: "Title and artist are required", success: false }
    }

    try {
        // Get the max sort order
        const maxOrder = await prisma.song.aggregate({
            _max: { sortOrder: true }
        })
        const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1

        await prisma.song.create({
            data: {
                title: title.trim(),
                artist: artist.trim(),
                albumArt: albumArt?.trim() || null,
                spotifyUrl: spotifyUrl?.trim() || null,
                sortOrder: nextOrder,
            }
        })

        revalidatePath('/admin')
        revalidatePath('/')
        return { message: "Song added!", success: true }
    } catch (error) {
        console.error("Failed to create song:", error)
        return { message: "Failed to add song.", success: false }
    }
}

export async function updateSong(songId: string, formData: FormData) {
    await checkAccess('admin', '/')

    const title = formData.get('title') as string
    const artist = formData.get('artist') as string
    const albumArt = formData.get('albumArt') as string || null
    const spotifyUrl = formData.get('spotifyUrl') as string || null

    if (!title?.trim() || !artist?.trim()) {
        return { message: "Title and artist are required", success: false }
    }

    try {
        await prisma.song.update({
            where: { id: songId },
            data: {
                title: title.trim(),
                artist: artist.trim(),
                albumArt: albumArt?.trim() || null,
                spotifyUrl: spotifyUrl?.trim() || null,
            }
        })

        revalidatePath('/admin')
        revalidatePath('/')
        return { message: "Song updated!", success: true }
    } catch (error) {
        console.error("Failed to update song:", error)
        return { message: "Failed to update song.", success: false }
    }
}

export async function deleteSong(songId: string) {
    await checkAccess('admin', '/')

    try {
        await prisma.song.delete({
            where: { id: songId },
        })

        revalidatePath('/admin')
        revalidatePath('/')
        return { message: "Song deleted", success: true }
    } catch (error) {
        console.error("Failed to delete song:", error)
        return { message: "Failed to delete song.", success: false }
    }
}

export async function upsertJourneyEntry(songId: string, formData: FormData) {
    await checkAccess('admin', '/')

    const memory = formData.get('memory') as string
    const mood = formData.get('mood') as string || null

    if (!memory?.trim()) {
        return { message: "Memory text is required", success: false }
    }

    try {
        await prisma.journeyEntry.upsert({
            where: { songId },
            create: {
                songId,
                memory: memory.trim(),
                mood: mood?.trim() || null,
            },
            update: {
                memory: memory.trim(),
                mood: mood?.trim() || null,
            },
        })

        revalidatePath('/admin')
        revalidatePath('/')
        return { message: "Journey entry saved!", success: true }
    } catch (error) {
        console.error("Failed to save journey entry:", error)
        return { message: "Failed to save journey entry.", success: false }
    }
}

export async function deleteJourneyEntry(songId: string) {
    await checkAccess('admin', '/')

    try {
        await prisma.journeyEntry.delete({
            where: { songId },
        })

        revalidatePath('/admin')
        revalidatePath('/')
        return { message: "Journey entry deleted", success: true }
    } catch (error) {
        console.error("Failed to delete journey entry:", error)
        return { message: "Failed to delete journey entry.", success: false }
    }
}

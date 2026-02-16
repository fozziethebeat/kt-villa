import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { BatchDetail } from './BatchDetail'

const links = [
    { url: '/', label: 'Home' },
    { url: '/admin', label: 'Admin' },
    { url: '/admin/batches', label: 'Batches' },
]

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
            baseRecipe: true,
            styleRecipe: true,
        }
    })

    if (!batch) {
        notFound()
    }

    return (
        <>
            <Header links={links} target={batch.name} />
            <div className="container mx-auto py-10 px-4 md:px-8">
                <BatchDetail batch={{
                    ...batch,
                    startedAt: batch.startedAt.toISOString(),
                    cutAt: batch.cutAt?.toISOString() || null,
                    readyAt: batch.readyAt?.toISOString() || null,
                    createdAt: batch.createdAt.toISOString(),
                    updatedAt: batch.updatedAt.toISOString(),
                    baseRecipe: {
                        id: batch.baseRecipe.id,
                        name: batch.baseRecipe.name,
                        ingredients: batch.baseRecipe.ingredients as any[],
                    },
                    styleRecipe: batch.styleRecipe ? {
                        id: batch.styleRecipe.id,
                        name: batch.styleRecipe.name,
                        ingredients: batch.styleRecipe.ingredients as any[],
                    } : null,
                }} />
            </div>
        </>
    )
}

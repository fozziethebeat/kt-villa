import { BatchForm } from './BatchForm'
import prisma from '@/lib/prisma'
import { Header } from '@/components/Header'

const links = [
    { url: '/', label: 'Home' },
    { url: '/admin', label: 'Admin' },
    { url: '/admin/batches', label: 'Batches' },
]

export default async function NewBatchPage() {
    const recipes = await prisma.recipe.findMany({
        orderBy: { name: 'asc' },
    })

    const baseRecipes = recipes.filter(r => r.type === 'BASE')
    const styleRecipes = recipes.filter(r => r.type === 'STYLE')

    return (
        <>
            <Header links={links} target="New Batch" />
            <div className="container mx-auto py-10 px-4 md:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Create New Batch</h1>
                    <p className="text-muted-foreground mt-2">
                        Start a new soap production batch by picking recipes and setting a start date.
                    </p>
                </div>
                <BatchForm baseRecipes={baseRecipes} styleRecipes={styleRecipes} />
            </div>
        </>
    )
}

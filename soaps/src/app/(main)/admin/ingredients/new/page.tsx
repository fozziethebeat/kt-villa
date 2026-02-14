import { IngredientForm } from './IngredientForm'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewIngredientPage() {
    return (
        <div className="container mx-auto py-10 px-4 md:px-8">
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                    <Link href="/admin/ingredients" className="flex items-center gap-2 text-muted-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Ingredients
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">New Ingredient</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new ingredient to your inventory.
                </p>
            </div>

            <IngredientForm />
        </div>
    )
}

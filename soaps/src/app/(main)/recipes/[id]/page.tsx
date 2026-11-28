import Link from 'next/link';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { BrandHeader } from '@/components/BrandHeader';
import { formatDate } from '@/lib/utils';
import { hasRole } from '@/lib/auth-check';

interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [recipe, isAdmin] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id },
    }),
    hasRole(['admin']),
  ]);

  if (!recipe) {
    notFound();
  }

  const isBase = recipe.type === 'BASE';
  let ingredients = (recipe.ingredients as unknown as RecipeIngredient[]) || [];
  if (isBase) {
    ingredients = [
      ...ingredients,
      { name: 'Water', quantity: 192, unit: 'g' },
      { name: 'Lye', quantity: 87, unit: 'g' },
    ];
  }

  const totalWeight = ingredients.reduce(
    (sum, ing) => sum + (Number(ing.quantity) || 0),
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <BrandHeader />

      <main className="flex-1 mx-auto w-full max-w-[960px] px-6 md:px-12 pt-28 pb-24">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/recipes"
            className="text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            ← Back to archive
          </Link>
          {isAdmin && (
            <Link
              href={`/admin/recipes/${recipe.id}/edit?from=/recipes/${recipe.id}`}
              className="text-[0.875rem] font-medium text-mineral-moss underline underline-offset-4 hover:opacity-75 transition-opacity duration-150"
            >
              Edit in studio
            </Link>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-[0.875rem] font-medium text-mineral-moss tabular-nums">
            {isBase ? 'Base formula' : 'Botanical style'} · Updated {formatDate(recipe.updatedAt)}
          </p>
          <h1 className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-foreground">
            {recipe.name}
          </h1>
          {recipe.notes && (
            <p className="pt-2 text-[1rem] text-muted-foreground leading-relaxed max-w-[60ch]">
              {recipe.notes}
            </p>
          )}
        </div>

        <section className="mt-14 border-t border-border pt-10">
          <div className="flex items-baseline justify-between gap-4 mb-6">
            <h2 className="text-[1rem] font-semibold text-foreground">
              Ingredients
            </h2>
            <span className="text-[0.875rem] text-muted-foreground tabular-nums">
              Total weight {totalWeight.toFixed(1)} g
            </span>
          </div>

          <ul className="border-y border-border divide-y divide-border">
            {ingredients.map((ingredient, index) => (
              <li
                key={index}
                className="py-4 flex items-baseline justify-between gap-4 text-[1rem]"
              >
                <span className="text-foreground">{ingredient.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {ingredient.quantity} {ingredient.unit || 'g'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

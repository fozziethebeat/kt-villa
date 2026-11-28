import Link from 'next/link';
import prisma from '@/lib/prisma';
import { BrandHeader } from '@/components/BrandHeader';

interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  const baseRecipes = recipes.filter((r) => r.type === 'BASE');
  const styleRecipes = recipes.filter((r) => r.type === 'STYLE');

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <BrandHeader />

      <main className="flex-1 mx-auto w-full max-w-[1360px] px-6 md:px-12 pt-28 pb-24 space-y-20">
        <div className="max-w-2xl">
          <h1 className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-foreground">
            Formulation archive
          </h1>
          <p className="mt-3 text-[1rem] text-muted-foreground">
            Foundational oil bases and botanical scent blends developed in the studio.
          </p>
        </div>

        <RecipeIndexSection
          title="Base formulas"
          description="Oil and butter foundations that shape lather and bar hardness."
          recipes={baseRecipes}
        />

        <RecipeIndexSection
          title="Botanical styles"
          description="Essential oil compositions, mineral clays, and natural colorants."
          recipes={styleRecipes}
        />
      </main>
    </div>
  );
}

function RecipeIndexSection({
  title,
  description,
  recipes,
}: {
  title: string;
  description: string;
  recipes: any[];
}) {
  if (recipes.length === 0) return null;

  return (
    <section className="border-t border-border pt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
      <div className="lg:col-span-4">
        <h2 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-[0.875rem] text-muted-foreground max-w-xs leading-relaxed">
          {description}
        </p>
      </div>

      <div className="lg:col-span-8 border-t border-border divide-y divide-border">
        {recipes.map((recipe) => {
          const isBase = recipe.type === 'BASE';
          let ingredients = (recipe.ingredients as unknown as RecipeIngredient[]) || [];
          if (isBase) {
            ingredients = [
              ...ingredients,
              { name: 'Water', quantity: 192, unit: 'g' },
              { name: 'Lye', quantity: 87, unit: 'g' },
            ];
          }
          const summary = ingredients
            .map((i) => i.name.replace(/ Essential Oil$/i, ''))
            .join(', ');

          return (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="group py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-8"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-[1rem] font-semibold text-foreground group-hover:text-mineral-moss transition-colors duration-150">
                  {recipe.name}
                </h3>
                {recipe.notes && (
                  <p className="mt-1 text-[0.875rem] text-muted-foreground line-clamp-1">
                    {recipe.notes}
                  </p>
                )}
                <p className="mt-1.5 text-[0.875rem] text-muted-foreground/80 line-clamp-1">
                  {summary}
                </p>
              </div>
              <span className="text-[0.875rem] text-muted-foreground group-hover:text-foreground transition-colors duration-150 shrink-0">
                View formula →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

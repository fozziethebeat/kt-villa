import Link from 'next/link';
import { BrandHeader } from '@/components/BrandHeader';
import prisma from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { RequestButton } from '@/components/RequestButton';

function getAgeInWeeks(date: Date) {
  const diffTime = Math.abs(new Date().getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7));
}

function getBatchDisplayImage(batch: { photoUrl?: string | null; imageUrl?: string | null }) {
  return batch.photoUrl || batch.imageUrl || '/images/soap-placeholder.jpg';
}

export default async function Home() {
  const [batches, styleRecipes, pendingRequests, schedulingBatches] = await Promise.all([
    prisma.batch.findMany({
      where: {
        status: {
          in: ['CURING', 'READY', 'STARTED'],
        },
      },
      orderBy: { startedAt: 'desc' },
      include: {
        styleRecipe: true,
        baseRecipe: true,
      },
    }),
    prisma.recipe.findMany({
      where: { type: 'STYLE' },
      orderBy: { name: 'asc' },
    }),
    prisma.batchRequest.groupBy({
      by: ['styleRecipeId'],
      where: {
        status: { in: ['PENDING', 'PLANNED'] },
      },
      _count: { id: true },
    }),
    prisma.batch.findMany({
      where: { status: 'SCHEDULING', styleRecipeId: { not: null } },
      select: { styleRecipeId: true },
    }),
  ]);

  const requestCountMap = new Map(
    pendingRequests.map((r) => [r.styleRecipeId, r._count.id])
  );
  const scheduledStyleIds = new Set(
    schedulingBatches.map((b) => b.styleRecipeId).filter(Boolean) as string[]
  );

  const readyBatches = batches.filter((b) => b.status === 'READY');
  const curingBatches = batches.filter(
    (b) => b.status === 'CURING' || b.status === 'STARTED'
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <BrandHeader transparent />

      {/* Full-bleed Seongsu Mineral Hero */}
      <section className="relative min-h-[88svh] lg:min-h-[94svh] w-full flex items-end overflow-hidden bg-secondary">
        <img
          src="/images/hero-mineral.jpg"
          alt="Hand-cut charcoal and sea-clay cold-process soap bars on wet pale travertine"
          className="absolute inset-0 h-full w-full object-cover object-[78%_28%] md:object-center"
        />
        {/* Subtle directional limestone wash for crisp headline contrast across mobile and desktop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#F3F3F1]/92 via-[#F3F3F1]/55 to-[#F3F3F1]/15 md:bg-gradient-to-r md:from-[#F3F3F1]/75 md:via-[#F3F3F1]/25 md:to-transparent"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1360px] px-6 md:px-12 pb-16 pt-32 md:pb-24">
          <div className="max-w-xl">
            <h1 className="text-[clamp(2.75rem,6.2vw,5.25rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-foreground">
              Small-batch bars, cured slow.
            </h1>
            <p className="mt-6 max-w-md text-[1rem] leading-relaxed text-foreground/80">
              Cold-process botanical soaps poured in small runs and cured for six weeks on cedar racks.
            </p>
            <div className="mt-9">
              <a
                href="#ready"
                className="inline-flex items-center justify-center bg-foreground px-7 py-3.5 text-[0.9375rem] font-medium text-background hover:bg-mineral-moss transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                Explore the rack
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 mx-auto w-full max-w-[1360px] px-6 md:px-12">
        {/* Ready Batches — Asymmetric Gallery Plates */}
        <section id="ready" className="scroll-mt-24 py-24 md:py-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14 md:mb-16">
            <div>
              <h2 className="text-[1.75rem] md:text-[2rem] font-semibold tracking-[-0.03em] text-foreground">
                Ready to enjoy
              </h2>
              <p className="mt-2 text-[1rem] text-muted-foreground max-w-prose">
                Fully cured batches wrapped and ready for daily use.
              </p>
            </div>
            <Link
              href="/collection"
              className="text-[0.875rem] font-medium text-foreground underline underline-offset-4 decoration-border hover:text-mineral-moss hover:decoration-mineral-moss transition-colors duration-150"
            >
              Open my collection
            </Link>
          </div>

          {readyBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 lg:[&>*:nth-child(3n+2)]:mt-12">
              {readyBatches.map((batch) => {
                const ingredients = (batch.styleRecipe?.ingredients as any[]) || [];
                const notesLine = ingredients
                  .slice(0, 3)
                  .map((i: any) => i.name.replace(/ Essential Oil$/i, ''))
                  .join(', ');

                return (
                  <Link
                    key={batch.id}
                    href={`/batches/${batch.id}`}
                    className="group block"
                  >
                    <div className="aspect-[4/5] w-full overflow-hidden bg-secondary">
                      <img
                        src={getBatchDisplayImage(batch)}
                        alt={batch.name}
                        className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      />
                    </div>
                    <div className="mt-5 flex items-baseline justify-between gap-4">
                      <h3 className="text-[1rem] font-semibold tracking-[-0.015em] text-foreground group-hover:text-mineral-moss transition-colors duration-150">
                        {batch.name}
                      </h3>
                      <span className="text-[0.875rem] text-muted-foreground tabular-nums shrink-0">
                        {formatDate(batch.readyAt || batch.startedAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[0.875rem] text-muted-foreground line-clamp-2">
                      {notesLine || batch.notes || `${batch.baseRecipe.name} base`}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border-y border-border py-16">
              <p className="text-[1rem] text-muted-foreground">
                No batches are fully cured right now. Check the curing rack below to see what is resting.
              </p>
            </div>
          )}
        </section>

        {/* On the Curing Rack — Horizontal Editorial Plates */}
        <section id="curing" className="scroll-mt-24 border-t border-border py-24 md:py-28">
          <div className="mb-14">
            <h2 className="text-[1.75rem] md:text-[2rem] font-semibold tracking-[-0.03em] text-foreground">
              On the curing rack
            </h2>
            <p className="mt-2 text-[1rem] text-muted-foreground max-w-prose">
              Freshly poured and resting for four to six weeks as water evaporates and the lather matures.
            </p>
          </div>

          {curingBatches.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-12">
              {curingBatches.map((batch) => {
                const ageWeeks = getAgeInWeeks(batch.startedAt);
                const statusLabel =
                  batch.status === 'STARTED'
                    ? 'Freshly poured'
                    : `Week ${Math.min(ageWeeks, 6)} of 6`;

                return (
                  <Link
                    key={batch.id}
                    href={`/batches/${batch.id}`}
                    className="group grid grid-cols-1 sm:grid-cols-12 gap-6 items-start border-t border-border pt-8"
                  >
                    <div className="sm:col-span-5 aspect-[4/3] overflow-hidden bg-secondary">
                      <img
                        src={getBatchDisplayImage(batch)}
                        alt={batch.name}
                        className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      />
                    </div>
                    <div className="sm:col-span-7 flex flex-col justify-between h-full">
                      <div>
                        <p className="text-[0.875rem] font-medium text-mineral-moss tabular-nums">
                          {statusLabel}
                        </p>
                        <h3 className="mt-1.5 text-[1rem] font-semibold tracking-[-0.015em] text-foreground group-hover:text-mineral-moss transition-colors duration-150">
                          {batch.name}
                        </h3>
                        <p className="mt-2 text-[0.875rem] text-muted-foreground leading-relaxed line-clamp-2">
                          {batch.notes || `Formulated on the ${batch.baseRecipe.name} base.`}
                        </p>
                      </div>
                      <p className="mt-4 text-[0.875rem] text-muted-foreground tabular-nums">
                        Poured {formatDate(batch.startedAt)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border-y border-border py-14">
              <p className="text-[1rem] text-muted-foreground">
                The curing rack is currently clear. Request a scent profile below for the next pour.
              </p>
            </div>
          )}
        </section>

        {/* Request a Style — 1px-Ruled Editorial Scent Index */}
        <section id="requests" className="scroll-mt-24 border-t border-border py-24 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-[1.75rem] md:text-[2rem] font-semibold tracking-[-0.03em] text-foreground">
                Request a style
              </h2>
              <p className="mt-3 text-[1rem] text-muted-foreground leading-relaxed max-w-sm">
                Tell the maker which essential oil and clay blend you would like poured next.
              </p>
            </div>

            <div className="lg:col-span-8">
              <div className="border-t border-border divide-y divide-border">
                {styleRecipes.map((recipe) => {
                  const requestCount = requestCountMap.get(recipe.id) || 0;
                  const isScheduled = scheduledStyleIds.has(recipe.id);
                  const notes = ((recipe.ingredients as any[]) || [])
                    .map((i: any) => i.name.replace(/ Essential Oil$/i, ''))
                    .join(', ');

                  return (
                    <div
                      key={recipe.id}
                      className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-3">
                          <Link
                            href={`/recipes/${recipe.id}`}
                            className="text-[1rem] font-medium text-foreground hover:text-mineral-moss transition-colors duration-150"
                          >
                            {recipe.name}
                          </Link>
                          {!isScheduled && requestCount > 0 && (
                            <span className="text-[0.875rem] text-muted-foreground tabular-nums">
                              {requestCount} {requestCount === 1 ? 'request' : 'requests'}
                            </span>
                          )}
                        </div>
                        {notes && (
                          <p className="mt-1 text-[0.875rem] text-muted-foreground truncate">
                            {notes}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        <RequestButton
                          recipeId={recipe.id}
                          recipeName={recipe.name}
                          requestCount={requestCount}
                          isScheduled={isScheduled}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-[1360px] px-6 md:px-12 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[0.875rem] text-muted-foreground">
          <span className="font-semibold tracking-[-0.03em] text-foreground">Our Morning Sunset</span>
          <span className="tabular-nums">Handcrafted cold-process soap · {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

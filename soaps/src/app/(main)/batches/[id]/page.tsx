import Link from 'next/link';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { BrandHeader } from '@/components/BrandHeader';
import { formatDate } from '@/lib/utils';

function getAgeInWeeks(date: Date) {
  const diffTime = Math.abs(new Date().getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7));
}

export default async function BatchViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      baseRecipe: true,
      styleRecipe: true,
      images: {
        orderBy: { version: 'desc' },
      },
    },
  });

  if (!batch || batch.status === 'SCHEDULING' || batch.status === 'ARCHIVED') {
    notFound();
  }

  const ageWeeks = getAgeInWeeks(batch.startedAt);
  const isCuring = batch.status === 'CURING' || batch.status === 'STARTED';
  const statusLine =
    batch.status === 'STARTED'
      ? 'Freshly poured'
      : isCuring
        ? `Curing · Week ${Math.min(ageWeeks, 6)} of 6`
        : 'Ready to enjoy';

  const primaryPhoto = batch.photoUrl || batch.imageUrl || '/images/soap-placeholder.jpg';
  const hasRealPhotoAndLabel = Boolean(batch.photoUrl && batch.imageUrl);

  const baseIngredients = [
    ...((batch.baseRecipe.ingredients as any[]) || []),
    { name: 'Distilled water' },
    { name: 'Sodium hydroxide (lye)' },
  ];
  const styleIngredients = (batch.styleRecipe?.ingredients as any[]) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <BrandHeader />

      <main className="flex-1 mx-auto w-full max-w-[1360px] px-6 md:px-12 pt-28 pb-24">
        <div className="mb-10">
          <Link
            href="/#ready"
            className="text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            ← Back to rack
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left — Primary Photograph & Optional Label Artwork */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-8">
            <div className="aspect-[4/5] w-full overflow-hidden bg-secondary">
              <img
                src={primaryPhoto}
                alt={batch.name}
                className="h-full w-full object-cover"
              />
            </div>

            {hasRealPhotoAndLabel && (
              <div className="border-t border-border pt-6 grid grid-cols-12 gap-5 items-center">
                <div className="col-span-4 aspect-square overflow-hidden bg-secondary">
                  <img
                    src={batch.imageUrl!}
                    alt={`${batch.name} label artwork`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="col-span-8">
                  <h2 className="text-[1rem] font-semibold text-foreground">
                    Batch label artwork
                  </h2>
                  <p className="mt-1 text-[0.875rem] text-muted-foreground leading-relaxed">
                    Custom studio label created for this batch&apos;s paper wrap.
                  </p>
                </div>
              </div>
            )}

            {!hasRealPhotoAndLabel && batch.images.length > 1 && (
              <div className="border-t border-border pt-6">
                <p className="text-[0.875rem] text-muted-foreground mb-4">
                  Label studies
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {batch.images.map((img) => (
                    <div
                      key={img.id}
                      className="aspect-square overflow-hidden bg-secondary"
                    >
                      <img
                        src={img.imageUrl}
                        alt={`Study ${img.version}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Editorial Story & Formulation */}
          <div className="lg:col-span-6 space-y-12">
            <div>
              <p className="text-[0.875rem] font-medium text-mineral-moss tabular-nums">
                {statusLine}
              </p>
              <h1 className="mt-2 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-foreground">
                {batch.name}
              </h1>
              {batch.notes && (
                <p className="mt-6 text-[1rem] leading-relaxed text-muted-foreground max-w-[60ch] whitespace-pre-wrap">
                  {batch.notes}
                </p>
              )}
            </div>

            {/* Cure Timeline */}
            <div className="border-t border-border pt-8">
              <h2 className="text-[1rem] font-semibold text-foreground mb-5">
                Cure timeline
              </h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-[0.875rem]">
                <div>
                  <dt className="text-muted-foreground">Poured</dt>
                  <dd className="mt-1 font-medium text-foreground tabular-nums">
                    {formatDate(batch.startedAt)}
                  </dd>
                </div>
                {batch.cutAt && (
                  <div>
                    <dt className="text-muted-foreground">Cut</dt>
                    <dd className="mt-1 font-medium text-foreground tabular-nums">
                      {formatDate(batch.cutAt)}
                    </dd>
                  </div>
                )}
                {batch.readyAt && (
                  <div>
                    <dt className="text-muted-foreground">Ready</dt>
                    <dd className="mt-1 font-medium text-foreground tabular-nums">
                      {formatDate(batch.readyAt)}
                    </dd>
                  </div>
                )}
                {batch.numBars !== null && (
                  <div>
                    <dt className="text-muted-foreground">Batch yield</dt>
                    <dd className="mt-1 font-medium text-foreground tabular-nums">
                      {batch.numBars} bars
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Scent & Additives */}
            {batch.styleRecipe && styleIngredients.length > 0 && (
              <div className="border-t border-border pt-8">
                <div className="flex items-baseline justify-between gap-4 mb-5">
                  <h2 className="text-[1rem] font-semibold text-foreground">
                    Botanicals &amp; clays
                  </h2>
                  <Link
                    href={`/recipes/${batch.styleRecipe.id}`}
                    className="text-[0.875rem] text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border transition-colors duration-150"
                  >
                    {batch.styleRecipe.name}
                  </Link>
                </div>
                <ul className="divide-y divide-border border-y border-border">
                  {styleIngredients.map((ing: any, i: number) => (
                    <li
                      key={i}
                      className="py-3 flex items-baseline justify-between gap-4 text-[0.875rem]"
                    >
                      <span className="text-foreground">{ing.name}</span>
                      {ing.quantity && (
                        <span className="text-muted-foreground tabular-nums">
                          {ing.quantity} {ing.unit || 'g'}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Base Formula */}
            <div className="border-t border-border pt-8">
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <h2 className="text-[1rem] font-semibold text-foreground">
                  Base formula
                </h2>
                <Link
                  href={`/recipes/${batch.baseRecipe.id}`}
                  className="text-[0.875rem] text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border transition-colors duration-150"
                >
                  {batch.baseRecipe.name}
                </Link>
              </div>
              <p className="text-[0.875rem] text-muted-foreground leading-relaxed max-w-[60ch]">
                {baseIngredients.map((i: any) => i.name).join(', ')}.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

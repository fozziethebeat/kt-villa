import Link from 'next/link';
import { BrandHeader } from '@/components/BrandHeader';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AddSoapForm } from '@/components/AddSoapForm';
import { formatDate } from '@/lib/utils';

export default async function CollectionPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/signin');
  }

  const gifts = await prisma.soapGift.findMany({
    where: { userId: session.user.id },
    orderBy: { givenAt: 'desc' },
    include: {
      batch: {
        include: {
          baseRecipe: true,
          styleRecipe: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <BrandHeader />

      <main className="flex-1 mx-auto w-full max-w-[1360px] px-6 md:px-12 pt-28 pb-24 space-y-16">
        {/* Title */}
        <div className="max-w-2xl">
          <h1 className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-foreground">
            My collection
          </h1>
          <p className="mt-3 text-[1rem] text-muted-foreground tabular-nums">
            {gifts.length === 0
              ? 'Redeem the code tucked inside a gifted bar to build your personal soap archive.'
              : `${gifts.length} ${gifts.length === 1 ? 'bar' : 'bars'} archived from past and current batches.`}
          </p>
        </div>

        {/* Code Redemption Bar */}
        <section className="border-y border-border py-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-[1rem] font-semibold text-foreground">
              Add a gifted bar
            </h2>
            <p className="mt-1 text-[0.875rem] text-muted-foreground">
              Enter the batch code printed on your soap wrap.
            </p>
          </div>
          <AddSoapForm />
        </section>

        {/* Collection Gallery */}
        {gifts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {gifts.map((gift) => {
              const batch = gift.batch;
              const photo =
                batch.photoUrl || batch.imageUrl || '/images/soap-placeholder.jpg';
              const styleName = batch.styleRecipe?.name;
              const personalNote =
                gift.note &&
                !gift.note.startsWith('Added via') &&
                !gift.note.startsWith('Auto-assigned')
                  ? gift.note
                  : null;
              const isPublicBatch =
                batch.status !== 'SCHEDULING' && batch.status !== 'ARCHIVED';

              const cardInner = (
                <>
                  <div className="aspect-[4/5] w-full overflow-hidden bg-secondary">
                    <img
                      src={photo}
                      alt={batch.name}
                      className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    />
                  </div>
                  <div className="mt-5 flex items-baseline justify-between gap-4">
                    <h3 className="text-[1rem] font-semibold tracking-[-0.015em] text-foreground group-hover:text-mineral-moss transition-colors duration-150">
                      {batch.name}
                    </h3>
                    <span className="text-[0.875rem] text-muted-foreground tabular-nums shrink-0">
                      {formatDate(gift.givenAt)}
                    </span>
                  </div>
                  {styleName && (
                    <p className="mt-1 text-[0.875rem] text-mineral-moss">
                      {styleName}
                    </p>
                  )}
                  <p className="mt-2 text-[0.875rem] text-muted-foreground line-clamp-2">
                    {batch.notes || `Made on the ${batch.baseRecipe.name} base.`}
                  </p>
                  {personalNote && (
                    <p className="mt-4 border-t border-border pt-3 text-[0.875rem] text-foreground/80">
                      &ldquo;{personalNote}&rdquo;
                    </p>
                  )}
                </>
              );

              return isPublicBatch ? (
                <Link
                  key={gift.id}
                  href={`/batches/${batch.id}`}
                  className="group block"
                >
                  {cardInner}
                </Link>
              ) : (
                <article key={gift.id} className="group">
                  {cardInner}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-16">
            <p className="text-[1rem] text-muted-foreground max-w-md">
              Your archive is empty. Once you receive a bar, enter its code above to save its ingredients and batch story here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

import { Header } from '@/components/Header';
import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, Calendar, Sparkles, Wind, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequestButton } from '@/components/RequestButton';

function getAgeInWeeks(date: Date) {
  const diffTime = Math.abs(new Date().getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

export default async function Home() {
  // Fetch active batches (not archived)
  const batches = await prisma.batch.findMany({
    where: {
      status: {
        in: ['CURING', 'READY', 'STARTED']
      }
    },
    orderBy: { startedAt: 'desc' },
    include: {
      styleRecipe: true,
      baseRecipe: true
    }
  });

  // Fetch style recipes for requests
  const styleRecipes = await prisma.recipe.findMany({
    where: { type: 'STYLE' },
    orderBy: { name: 'asc' }
  });

  // Fetch pending/planned batch requests grouped by style
  const pendingRequests = await prisma.batchRequest.groupBy({
    by: ['styleRecipeId'],
    where: {
      status: { in: ['PENDING', 'PLANNED'] }
    },
    _count: { id: true }
  });

  // Build a map of styleRecipeId -> request count
  const requestCountMap = new Map(
    pendingRequests.map(r => [r.styleRecipeId, r._count.id])
  );

  // Fetch styles that already have a SCHEDULING batch
  const schedulingBatches = await prisma.batch.findMany({
    where: { status: 'SCHEDULING', styleRecipeId: { not: null } },
    select: { styleRecipeId: true }
  });
  const scheduledStyleIds = new Set(
    schedulingBatches.map(b => b.styleRecipeId).filter(Boolean) as string[]
  );

  const readyBatches = batches.filter(b => b.status === 'READY');
  const curingBatches = batches.filter(b => b.status === 'CURING' || b.status === 'STARTED');

  return (
    <div className="min-h-screen flex flex-col">
      <Header links={[{ url: '/', label: 'Home' }]} />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-terracotta-light via-brand-cream to-brand-rose-light opacity-60" />
        {/* Subtle decorative circles */}
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-brand-rose-light/40 blur-3xl" />
        <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full bg-brand-sage-light/50 blur-3xl" />
        <div className="container relative mx-auto px-4 py-24 sm:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-brand-terracotta/20 bg-brand-cream/80 px-4 py-1.5 text-sm text-brand-terracotta mb-8 backdrop-blur-sm">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            <span className="font-medium tracking-wide uppercase text-xs">Handcrafted Small Batch Soaps</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl text-brand-warm-brown mb-6 leading-[1.1]">
            Pure ingredients.<br />
            <span className="text-brand-terracotta italic">Artisan crafted.</span>
          </h1>
          <p className="max-w-xl text-lg text-brand-stone mb-10 leading-relaxed">
            Discover our collection of handcrafted soaps, made with natural oils
            and cured to perfection. See what's on the rack and what's ready for you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 bg-brand-warm-brown hover:bg-brand-warm-brown/90 text-brand-cream" asChild>
              <a href="#ready">Ready Batches</a>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 border-brand-terracotta/30 text-brand-terracotta hover:bg-brand-terracotta-light" asChild>
              <a href="#curing">Curing Rack</a>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 border-brand-sage/30 text-brand-sage hover:bg-brand-sage-light" asChild>
              <a href="/collection">
                <Droplets className="mr-2 h-4 w-4" />
                My Collection
              </a>
            </Button>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-16 space-y-24">

        {/* Ready Batches */}
        <section id="ready" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">Ready to Enjoy</h2>
              <p className="text-brand-stone mt-2">Fully cured and ready for use.</p>
            </div>
          </div>

          {readyBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {readyBatches.map(batch => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-brand-terracotta/20 p-12 text-center bg-brand-cream/50">
              <Wind className="mx-auto h-12 w-12 text-brand-terracotta/30 mb-4" />
              <h3 className="text-lg font-medium text-brand-warm-brown">Nothing ready just yet</h3>
              <p className="text-brand-stone mt-1">Check back soon — good things take time.</p>
            </div>
          )}
        </section>

        {/* Curing Rack */}
        <section id="curing" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-10">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">On the Curing Rack</h2>
              <p className="text-brand-stone mt-2">Freshly poured and curing. Good soap is worth the wait.</p>
            </div>
          </div>

          {curingBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {curingBatches.map(batch => (
                <BatchCard key={batch.id} batch={batch} isCuring />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-brand-sage/20 p-12 text-center bg-brand-sage-light/30">
              <Droplets className="mx-auto h-12 w-12 text-brand-sage/30 mb-4" />
              <h3 className="text-lg font-medium text-brand-warm-brown">The rack is empty</h3>
              <p className="text-brand-stone mt-1">We'll be making more soon!</p>
            </div>
          )}
        </section>

        {/* Flavor Library / Requests */}
        <section id="requests" className="scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">Request a Style</h2>
            <p className="text-brand-stone mt-4 text-lg">
              See something you love? Let us know which styles you'd like in the next batch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {styleRecipes.map(recipe => {
              const requestCount = requestCountMap.get(recipe.id) || 0;
              const isScheduled = scheduledStyleIds.has(recipe.id);
              return (
                <div
                  key={recipe.id}
                  className={cn(
                    "group relative flex flex-col rounded-xl border p-6 hover:shadow-lg transition-all duration-300 cursor-default",
                    isScheduled
                      ? "border-brand-sage/40 ring-1 ring-brand-sage-light bg-brand-sage-light/30"
                      : requestCount > 0
                        ? "border-brand-terracotta/30 ring-1 ring-brand-terracotta-light bg-brand-terracotta-light/30"
                        : "border-border bg-card hover:border-brand-rose/30"
                  )}
                >
                  {/* Status indicator badges */}
                  {isScheduled && (
                    <div className="absolute -top-2.5 right-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-sage-light border border-brand-sage/30 px-2.5 py-0.5 text-xs font-medium text-brand-sage">
                        <Clock className="h-3 w-3" />
                        Scheduled
                      </span>
                    </div>
                  )}
                  {!isScheduled && requestCount > 0 && (
                    <div className="absolute -top-2.5 right-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-terracotta-light border border-brand-terracotta/30 px-2.5 py-0.5 text-xs font-medium text-brand-terracotta">
                        <Users className="h-3 w-3" />
                        {requestCount} {requestCount === 1 ? 'request' : 'requests'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-300",
                      isScheduled
                        ? "bg-brand-sage-light group-hover:bg-brand-sage"
                        : "bg-brand-rose-light group-hover:bg-brand-rose"
                    )}>
                      <Sparkles className={cn(
                        "h-5 w-5 group-hover:text-white transition-colors duration-300",
                        isScheduled ? "text-brand-sage" : "text-brand-rose"
                      )} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-brand-warm-brown mb-2 group-hover:text-brand-terracotta transition-colors">{recipe.name}</h3>
                  <p className="text-sm text-brand-stone line-clamp-2 mb-4 flex-1">
                    {(recipe.ingredients as any[]).map((i: any) => i.name).join(', ')}
                  </p>

                  {/* Demand indicator bar */}
                  {requestCount > 0 && !isScheduled && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-brand-stone mb-1">
                        <span>Demand</span>
                        <span className="text-brand-terracotta font-medium">{requestCount} interested</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-brand-linen overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-terracotta to-brand-rose transition-all duration-500"
                          style={{ width: `${Math.min(requestCount * 20, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <RequestButton
                    recipeId={recipe.id}
                    recipeName={recipe.name}
                    requestCount={requestCount}
                    isScheduled={isScheduled}
                  />
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <footer className="py-12 border-t border-border text-center text-brand-stone text-sm bg-brand-cream/50">
        <p className="font-serif italic text-brand-terracotta mb-1">KT Soaps</p>
        <p>© {new Date().getFullYear()} Handcrafted with care.</p>
      </footer>
    </div>
  );
}

function BatchCard({ batch, isCuring }: { batch: any, isCuring?: boolean }) {
  const ageWeeks = getAgeInWeeks(batch.startedAt);

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 group ring-1 ring-border">
      <div className="aspect-[4/3] relative overflow-hidden bg-brand-cream">
        {batch.imageUrl ? (
          <img
            src={batch.imageUrl}
            alt={batch.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-terracotta-light to-brand-rose-light">
            <Droplets className="h-16 w-16 text-brand-terracotta/30" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge
            className={cn(
              "backdrop-blur-md shadow-sm border-0 text-xs font-medium",
              isCuring
                ? "bg-brand-sage-light/90 text-brand-sage"
                : "bg-brand-cream/90 text-brand-terracotta"
            )}
          >
            {isCuring ? 'Curing' : 'Ready'}
          </Badge>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="flex items-center text-xs text-brand-stone mb-3 space-x-3">
          <span className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            {batch.startedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          {isCuring && (
            <span className="flex items-center text-brand-sage font-medium">
              <Wind className="w-3.5 h-3.5 mr-1" />
              Curing for {ageWeeks} {ageWeeks === 1 ? 'week' : 'weeks'}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-xl text-brand-warm-brown mb-2 group-hover:text-brand-terracotta transition-colors">
          {batch.name}
        </h3>
        <p className="text-sm text-brand-stone line-clamp-2 mb-4">
          {batch.notes || `A lovely batch made with ${batch.baseRecipe.name} base.`}
        </p>

        {batch.styleRecipe && (
          <div className="flex flex-wrap gap-1.5">
            {(batch.styleRecipe.ingredients as any[]).slice(0, 3).map((ing: any, i: number) => (
              <Badge key={i} variant="outline" className="text-xs font-normal text-brand-stone bg-brand-cream border-brand-terracotta/15">
                {ing.name}
              </Badge>
            ))}
            {(batch.styleRecipe.ingredients as any[]).length > 3 && (
              <span className="text-xs text-brand-stone/60 pl-1">+{((batch.styleRecipe.ingredients as any[]).length - 3)} more</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

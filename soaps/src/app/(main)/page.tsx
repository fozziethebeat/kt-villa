import { Header } from '@/components/Header';
import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, Calendar, Sparkles, Wind } from 'lucide-react';
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

  const readyBatches = batches.filter(b => b.status === 'READY');
  const curingBatches = batches.filter(b => b.status === 'CURING' || b.status === 'STARTED');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header links={[{ url: '/', label: 'Home' }]} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 opacity-50" />
        <div className="container relative mx-auto px-4 py-24 sm:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1 text-sm text-indigo-600 mb-8 backdrop-blur-sm">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            <span className="font-medium">Handcrafted Small Batch Soaps</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-slate-900 mb-6">
            Pure ingredients.<br />
            <span className="text-indigo-600">Artisan crafted.</span>
          </h1>
          <p className="max-w-2xl text-lg text-slate-600 mb-10 leading-relaxed">
            Discover our collection of handcrafted soaps, made with natural oils
            and cured to perfection. Check what's currently curing on the rack
            and what's ready for your shower.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="rounded-full px-8" asChild>
              <a href="#ready">Shop Ready Batches</a>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
              <a href="#curing">View Curing Rack</a>
            </Button>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-16 space-y-24">

        {/* Ready Batches */}
        <section id="ready" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Ready to Enjoy</h2>
              <p className="text-slate-500 mt-2">Fully cured and ready for use.</p>
            </div>
          </div>

          {readyBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {readyBatches.map(batch => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-slate-50">
              <Wind className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900">Nothing ready just yet</h3>
              <p className="text-slate-500 mt-1">Check back soon, good things take time!</p>
            </div>
          )}
        </section>

        {/* Curing Rack */}
        <section id="curing" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">On the Curing Rack</h2>
              <p className="text-slate-500 mt-2">Freshly poured and curing. Good soap is worth the wait.</p>
            </div>
          </div>

          {curingBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {curingBatches.map(batch => (
                <BatchCard key={batch.id} batch={batch} isCuring />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-slate-50">
              <Droplets className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900">The rack is empty</h3>
              <p className="text-slate-500 mt-1">We'll be making more soon!</p>
            </div>
          )}
        </section>

        {/* Flavor Library / Requests */}
        <section id="requests" className="scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Request a Style</h2>
            <p className="text-slate-500 mt-4 text-lg">
              See something you like? Let us know which styles you'd like to see in our next batch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {styleRecipes.map(recipe => (
              <div
                key={recipe.id}
                className="group relative flex flex-col bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 cursor-default"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300">
                    <Sparkles className="h-5 w-5 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{recipe.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                  {(recipe.ingredients as any[]).map((i: any) => i.name).join(', ')}
                </p>
                <RequestButton recipeId={recipe.id} recipeName={recipe.name} />
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="py-12 bg-white border-t border-slate-100 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} KT Soaps. Handcrafted with care.</p>
      </footer>
    </div>
  );
}

function BatchCard({ batch, isCuring }: { batch: any, isCuring?: boolean }) {
  const ageWeeks = getAgeInWeeks(batch.startedAt);

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 group ring-1 ring-slate-200">
      <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
        {batch.imageUrl ? (
          <img
            src={batch.imageUrl}
            alt={batch.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
            <Droplets className="h-16 w-16 text-indigo-200" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge variant={isCuring ? "secondary" : "default"} className="backdrop-blur-md bg-white/90 shadow-sm border-0">
            {isCuring ? 'Curing' : 'Ready'}
          </Badge>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="flex items-center text-xs text-slate-500 mb-3 space-x-3">
          <span className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            {batch.startedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          {isCuring && (
            <span className="flex items-center text-indigo-600 font-medium">
              <Wind className="w-3.5 h-3.5 mr-1" />
              Curing for {ageWeeks} {ageWeeks === 1 ? 'week' : 'weeks'}
            </span>
          )}
        </div>
        <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
          {batch.name}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
          {batch.notes || `A lovely batch made with ${batch.baseRecipe.name} base.`}
        </p>

        {batch.styleRecipe && (
          <div className="flex flex-wrap gap-1.5">
            {(batch.styleRecipe.ingredients as any[]).slice(0, 3).map((ing: any, i: number) => (
              <Badge key={i} variant="outline" className="text-xs font-normal text-slate-600 bg-slate-50">
                {ing.name}
              </Badge>
            ))}
            {(batch.styleRecipe.ingredients as any[]).length > 3 && (
              <span className="text-xs text-slate-400 pl-1">+{((batch.styleRecipe.ingredients as any[]).length - 3)} more</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

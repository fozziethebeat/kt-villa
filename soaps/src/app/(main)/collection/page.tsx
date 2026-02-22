import { Header } from '@/components/Header';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, Calendar, Sparkles, KeyRound } from 'lucide-react';
import { AddSoapForm } from '@/components/AddSoapForm';
import { formatDate } from '@/lib/utils';

const links = [
    { url: '/', label: 'Home' },
];

export default async function CollectionPage() {
    const session = await auth.api.getSession({
        headers: await headers()
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
                }
            }
        }
    });

    return (
        <>
            <Header links={links} target="My Collection" />
            <div className="container mx-auto py-10 px-4 md:px-8 space-y-10">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-brand-warm-brown">My Soap Collection</h1>
                        <p className="text-brand-stone mt-2">
                            {gifts.length === 0
                                ? "You haven't collected any soaps yet. Add one with a soap code!"
                                : `You have ${gifts.length} ${gifts.length === 1 ? 'soap' : 'soaps'} in your collection.`
                            }
                        </p>
                    </div>
                </div>

                {/* Add Soap Section */}
                <div className="bg-gradient-to-r from-brand-terracotta-light via-brand-cream to-brand-rose-light rounded-xl border border-brand-terracotta/15 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                            <h2 className="text-sm font-semibold text-brand-warm-brown flex items-center gap-2">
                                <KeyRound className="h-4 w-4 text-brand-terracotta" />
                                Got a new soap?
                            </h2>
                            <p className="text-xs text-brand-stone mt-1">Enter the code that came with your soap to add it to your collection.</p>
                        </div>
                        <AddSoapForm />
                    </div>
                </div>

                {/* Collection Grid */}
                {gifts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gifts.map(gift => (
                            <SoapCard key={gift.id} gift={gift} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border-2 border-dashed border-brand-terracotta/20 p-16 text-center bg-brand-cream/50">
                        <Droplets className="mx-auto h-16 w-16 text-brand-terracotta/20 mb-6" />
                        <h3 className="text-xl font-semibold text-brand-warm-brown mb-2">Your collection is empty</h3>
                        <p className="text-brand-stone max-w-md mx-auto">
                            When you receive a soap, you'll get a code to add it here. Your collection will show all the soaps you've enjoyed!
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

function SoapCard({ gift }: { gift: any }) {
    const batch = gift.batch;
    const styleName = batch.styleRecipe?.name;
    const ingredients = batch.styleRecipe?.ingredients as any[] | undefined;

    return (
        <Card className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group ring-1 ring-border">
            <div className="aspect-[4/3] relative overflow-hidden bg-brand-cream">
                {batch.imageUrl ? (
                    <img
                        src={batch.imageUrl}
                        alt={batch.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-terracotta-light to-brand-rose-light">
                        <Droplets className="h-16 w-16 text-brand-terracotta/25" />
                    </div>
                )}
                <div className="absolute top-4 left-4">
                    <Badge className="backdrop-blur-md bg-white/90 shadow-sm border-0 text-brand-warm-brown">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(gift.givenAt)}
                    </Badge>
                </div>
            </div>
            <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-brand-warm-brown mb-1 group-hover:text-brand-terracotta transition-colors">
                    {batch.name}
                </h3>
                {styleName && (
                    <p className="text-sm text-brand-terracotta font-medium mb-3 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        {styleName}
                    </p>
                )}
                <p className="text-sm text-brand-stone line-clamp-2 mb-4">
                    {batch.notes || `Made with ${batch.baseRecipe.name} base.`}
                </p>

                {ingredients && ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {ingredients.slice(0, 4).map((ing: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs font-normal text-brand-stone bg-brand-cream border-brand-terracotta/15">
                                {ing.name}
                            </Badge>
                        ))}
                        {ingredients.length > 4 && (
                            <span className="text-xs text-brand-stone/60 pl-1 self-center">+{ingredients.length - 4} more</span>
                        )}
                    </div>
                )}

                {gift.note && !gift.note.startsWith('Added via') && !gift.note.startsWith('Auto-assigned') && (
                    <p className="mt-3 text-xs text-brand-stone/70 italic border-t border-border pt-3">
                        "{gift.note}"
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

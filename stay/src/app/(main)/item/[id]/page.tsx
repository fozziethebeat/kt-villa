import Link from "next/link";
import { gql } from "@apollo/client";
import {
  ArrowLeft,
  Calendar,
  Lock,
  Palette,
  Sparkles,
  User,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getClient } from "@/graphql/ApolloClient";

const QUERY = gql`
  query BookingItemQuery($id: String!) {
    bookingItem(id: $id) {
      id
      image
      text
      claimStatus
      claimVisible
      ownerUsername
      style
      season
      subject
      bookingCode
    }
  }
`;

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  let bookingItem: any = null;
  try {
    const { data } = await getClient().query({
      query: QUERY,
      variables: { id },
      fetchPolicy: "no-cache",
    });
    bookingItem = (data as any)?.bookingItem;
  } catch {
    bookingItem = null;
  }

  if (!bookingItem) {
    return (
      <div className="alpine-container py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">
            Artwork Not Found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t find this emblem in the KT Villa archive.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Stays
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="alpine-container space-y-8 py-8 lg:py-12">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Stays
        </Link>

        {bookingItem.bookingCode && (
          <Link
            href={`/public-booking/${bookingItem.bookingCode}`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Calendar className="h-3.5 w-3.5" />
            View Associated Stay Details
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
            <div className="relative aspect-square w-full bg-muted">
              <img
                src={bookingItem.image}
                alt={`KT Villa Emblem #${bookingItem.id}`}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Palette className="h-3.5 w-3.5" />
                Emblem #{bookingItem.id}
              </span>
              {bookingItem.season && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  {bookingItem.season}
                </span>
              )}
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">
                {bookingItem.claimStatus}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {bookingItem.ownerUsername}&apos;s Trip Emblem
            </h1>

            {!isLoggedIn && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-900">
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                <span>
                  Guest names are anonymized for signed-out visitors.{" "}
                  <Link
                    href="/signin"
                    className="font-semibold underline hover:text-amber-950"
                  >
                    Sign in
                  </Link>{" "}
                  to view full details.
                </span>
              </div>
            )}

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned Guest
                </dt>
                <dd className="mt-1 flex items-center gap-2 text-sm font-bold text-foreground">
                  <User className="h-4 w-4 text-primary" />
                  {bookingItem.ownerUsername}
                </dd>
              </div>

              {bookingItem.style && (
                <div className="rounded-xl border border-border bg-background p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Art Style
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-foreground">
                    {bookingItem.style}
                  </dd>
                </div>
              )}
            </dl>

            {bookingItem.subject && (
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subject &amp; Character
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {bookingItem.subject}
                </p>
              </div>
            )}

            {bookingItem.text && (
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Generated Prompt
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">
                  {bookingItem.text}
                </p>
              </div>
            )}

            {bookingItem.bookingCode && (
              <div className="pt-2">
                <Link
                  href={`/public-booking/${bookingItem.bookingCode}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  <Calendar className="h-4 w-4" />
                  Go to Public Stay Page
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

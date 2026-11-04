import Link from "next/link";
import { gql } from "@apollo/client";
import { differenceInCalendarDays, format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Cat,
  CheckCircle2,
  Clock,
  Dog,
  KeyRound,
  Lock,
  Palette,
  Settings,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getClient } from "@/graphql/ApolloClient";
import { PublicBookingActions } from "@/components/PublicBookingActions";

const PUBLIC_BOOKING_QUERY = gql`
  query PublicBookingPageQuery($bookingCode: String!) {
    publicBooking(bookingCode: $bookingCode) {
      id
      bookingCode
      startDate
      endDate
      status
      numGuests
      maxGuests
      withCat
      withDog
      hostName
      isOwner
      StableItem {
        id
        image
        text
        style
        season
        subject
      }
      MemberBooking {
        id
        status
        memberName
      }
    }
  }
`;

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  let booking: any = null;
  try {
    const { data } = await getClient().query({
      query: PUBLIC_BOOKING_QUERY,
      variables: { bookingCode: code },
      fetchPolicy: "no-cache",
    });
    booking = (data as any)?.publicBooking;
  } catch {
    booking = null;
  }

  if (!booking) {
    return (
      <div className="alpine-container py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">
            Stay Not Found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This booking link may be invalid, cancelled, or no longer available.
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

  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const nights = Math.max(1, differenceInCalendarDays(end, start));
  const openSpots = Math.max(
    0,
    (booking.maxGuests ?? 1) - (booking.numGuests ?? 1)
  );
  const isApproved = booking.status === "approved";
  const imageSrc = booking.StableItem?.image || "/img/house.png";

  const approvedMembers = (booking.MemberBooking ?? []).filter(
    (m: any) => m.status === "approved" || m.status === "pending"
  );

  // Check if current logged-in user already requested to join
  const currentUserName = session?.user?.name;
  const existingMemberEntry = currentUserName
    ? (booking.MemberBooking ?? []).find(
        (m: any) => m.memberName === currentUserName
      )
    : null;

  return (
    <div className="alpine-container space-y-8 py-8 lg:py-12">
      {/* Top Breadcrumb & Owner Shortcut */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Stays
        </Link>

        {booking.isOwner && (
          <Link
            href={`/booking/${booking.bookingCode}`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Settings className="h-3.5 w-3.5" />
            Manage Your Booking (Owner View)
          </Link>
        )}
      </div>

      {/* Main Split Card */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: AI Generated Emblem Showcase */}
        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
            <div className="relative aspect-square w-full bg-muted">
              <img
                src={imageSrc}
                alt={`AI Emblem for ${booking.hostName}'s Stay`}
                className="h-full w-full object-cover"
              />
              {booking.StableItem?.season && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  {booking.StableItem.season}
                </span>
              )}
            </div>

            {booking.StableItem && (
              <div className="space-y-3 border-t border-border bg-muted/30 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                    <Palette className="h-3.5 w-3.5" />
                    Bespoke Trip Emblem #{booking.StableItem.id}
                  </span>
                  {booking.StableItem.style && (
                    <span className="rounded-md border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground">
                      Style: {booking.StableItem.style}
                    </span>
                  )}
                </div>

                {booking.StableItem.subject && (
                  <p className="text-xs font-medium text-foreground/90">
                    Featured Motif:{" "}
                    <span className="text-muted-foreground">
                      {booking.StableItem.subject}
                    </span>
                  </p>
                )}

                {booking.StableItem.text && (
                  <details className="group text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-medium text-foreground/80 hover:text-foreground">
                      View AI Art Direction Prompt
                    </summary>
                    <p className="mt-2 rounded-xl border border-border bg-background p-3 leading-relaxed">
                      {booking.StableItem.text}
                    </p>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Trip Details, Roster & Join Action */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isApproved
                    ? "bg-emerald-500/15 text-emerald-800"
                    : "bg-amber-500/15 text-amber-800"
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                <span className="capitalize">{booking.status} Stay</span>
              </span>

              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground/80">
                {nights} {nights === 1 ? "Night" : "Nights"} in Hakuba
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {booking.hostName}&apos;s Mountain Stay
            </h1>

            {!isLoggedIn && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-900">
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                <span>
                  Guest names are anonymized for public visitors.{" "}
                  <Link
                    href="/signin"
                    className="font-semibold underline hover:text-amber-950"
                  >
                    Sign in
                  </Link>{" "}
                  to see who is going.
                </span>
              </div>
            )}

            {/* Dates & Capacity Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Check-In → Check-Out
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-base font-bold text-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(start, "EEEE")} to {format(end, "EEEE")} ({nights}{" "}
                  {nights === 1 ? "night" : "nights"})
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Group Size &amp; Spots
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-base font-bold text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>
                    {booking.numGuests} / {booking.maxGuests} Guests
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {openSpots > 0
                    ? `${openSpots} ${openSpots === 1 ? "spot" : "spots"} open for friends to join`
                    : "Crew is currently full"}
                </p>
              </div>
            </div>

            {/* Pets Indicator */}
            {(booking.withDog || booking.withCat) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {booking.withDog && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground">
                    <Dog className="h-4 w-4 text-primary" />
                    Dog joining this trip
                  </span>
                )}
                {booking.withCat && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground">
                    <Cat className="h-4 w-4 text-primary" />
                    Cat joining this trip
                  </span>
                )}
              </div>
            )}

            {/* Trip Roster */}
            <div className="mt-6 space-y-3 border-t border-border pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Trip Crew ({1 + approvedMembers.length})
              </h2>
              <ul className="space-y-2">
                <li className="flex items-center justify-between rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm">
                  <span className="flex items-center gap-2 font-semibold text-foreground">
                    <UserCheck className="h-4 w-4 text-primary" />
                    {booking.hostName}
                  </span>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    Trip Host
                  </span>
                </li>

                {approvedMembers.map((member: any) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {member.memberName}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${
                        member.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-800"
                          : "bg-amber-500/15 text-amber-800"
                      }`}
                    >
                      {member.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Join Trip CTA */}
            {!booking.isOwner && (
              <div className="mt-6 border-t border-border pt-5">
                {isLoggedIn ? (
                  <PublicBookingActions
                    bookingId={booking.id}
                    hasOpenSpots={openSpots > 0}
                    alreadyRequestedStatus={existingMemberEntry?.status}
                  />
                ) : (
                  <Link
                    href="/signin"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    <KeyRound className="h-4 w-4" />
                    <span>Sign In to View Names or Join Trip</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

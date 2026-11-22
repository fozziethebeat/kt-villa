import Link from "next/link";
import {
  Calendar,
  Cat,
  CheckCircle2,
  Clock,
  Dog,
  Sparkles,
  User,
  Users,
} from "lucide-react";

import {
  formatJstFullDate,
  formatJstMonthDay,
  getJstNights,
} from "@/lib/jst-date";

export interface PublicBookingCardData {
  id: number;
  bookingCode: string;
  startDate: string;
  endDate: string;
  status: string;
  numGuests: number;
  maxGuests: number;
  withCat?: boolean | null;
  withDog?: boolean | null;
  hostName: string;
  isOwner?: boolean;
  StableItem?: {
    id: number;
    image: string;
    text?: string | null;
    style?: string | null;
    season?: string | null;
    subject?: string | null;
  } | null;
}

export function BookingItemCard({
  booking,
}: {
  booking: PublicBookingCardData;
}) {
  const nights = Math.max(1, getJstNights(booking.startDate, booking.endDate));
  const openSpots = Math.max(0, (booking.maxGuests ?? 1) - (booking.numGuests ?? 1));
  const isApproved = booking.status === "approved";
  const href = booking.isOwner
    ? `/booking/${booking.bookingCode}`
    : `/public-booking/${booking.bookingCode}`;

  const imageSrc = booking.StableItem?.image || "/img/house.png";

  return (
    <article className="alpine-card group relative flex flex-col overflow-hidden">
      {/* Artwork Header with 1:1 Aspect Ratio */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={
            booking.StableItem?.subject
              ? `AI Emblem: ${booking.StableItem.subject}`
              : `Trip Emblem for ${formatJstMonthDay(booking.startDate)} stay`
          }
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Top Overlay Badges */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md ${
              isApproved
                ? "bg-emerald-950/80 text-emerald-200"
                : "bg-amber-950/80 text-amber-200"
            }`}
          >
            {isApproved ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span className="capitalize">{booking.status}</span>
          </span>

          {booking.StableItem?.season && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-amber-300" />
              {booking.StableItem.season}
            </span>
          )}
        </div>

        {/* Bottom Gradient with Date Banner */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10 text-white">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-bold tracking-tight">
              <Calendar className="h-4 w-4 text-amber-300" />
              <span>
                {formatJstMonthDay(booking.startDate)} –{" "}
                {formatJstFullDate(booking.endDate)}
              </span>
            </p>
            <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
              {nights} {nights === 1 ? "night" : "nights"}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold tracking-tight text-foreground">
              <Link href={href} className="focus:outline-none">
                <span className="absolute inset-0 z-10" aria-hidden="true" />
                {booking.hostName}&apos;s Stay
              </Link>
            </h3>
            {booking.isOwner && (
              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                Your Trip
              </span>
            )}
          </div>

          {booking.StableItem?.style && (
            <p className="line-clamp-1 text-xs font-medium text-muted-foreground">
              Style: {booking.StableItem.style}
            </p>
          )}
        </div>

        {/* Footer Metadata */}
        <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-medium text-foreground/85">
              <Users className="h-3.5 w-3.5 text-primary" />
              {booking.numGuests}/{booking.maxGuests} guests
            </span>
            {openSpots > 0 && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                +{openSpots} open
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {booking.withDog && (
              <span
                title="Dog joining"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-foreground/80"
              >
                <Dog className="h-3.5 w-3.5" />
              </span>
            )}
            {booking.withCat && (
              <span
                title="Cat joining"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-foreground/80"
              >
                <Cat className="h-3.5 w-3.5" />
              </span>
            )}
            {!booking.withDog && !booking.withCat && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary group-hover:underline">
                View stay →
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Settings,
  Users,
  XCircle,
} from "lucide-react";

import {
  formatJstFullDate,
  formatJstMonthDay,
  getJstNights,
} from "@/lib/jst-date";

export function UserBookingCard({ booking }: { booking: any }) {
  const nights = Math.max(1, getJstNights(booking.startDate, booking.endDate));
  const isApproved = booking.status === "approved";
  const isPending = booking.status === "pending";
  const imageSrc = booking?.item?.image || "/img/house.png";

  return (
    <article className="alpine-card group relative flex flex-col overflow-hidden">
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={`AI Emblem for your ${formatJstMonthDay(booking.startDate)} trip`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md ${
              isApproved
                ? "bg-emerald-950/80 text-emerald-200"
                : isPending
                ? "bg-amber-950/80 text-amber-200"
                : "bg-red-950/80 text-red-200"
            }`}
          >
            {isApproved ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : isPending ? (
              <Clock className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-red-400" />
            )}
            <span className="capitalize">{booking.status}</span>
          </span>

          <span className="rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            {nights} {nights === 1 ? "night" : "nights"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div>
          <h3 className="text-base font-bold tracking-tight text-foreground">
            <Link
              href={`/booking/${booking.bookingCode}`}
              className="focus:outline-none"
            >
              <span className="absolute inset-0 z-10" aria-hidden="true" />
              {formatJstMonthDay(booking.startDate)} –{" "}
              {formatJstFullDate(booking.endDate)}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Ref: {booking.bookingCode.slice(0, 8)}…
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-foreground/85">
            <Users className="h-3.5 w-3.5 text-primary" />
            {booking.numGuests} {booking.numGuests === 1 ? "guest" : "guests"}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:underline">
            <Settings className="h-3.5 w-3.5" />
            Manage Stay →
          </span>
        </div>
      </div>
    </article>
  );
}

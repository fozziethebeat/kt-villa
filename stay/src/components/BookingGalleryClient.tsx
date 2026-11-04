"use client";

import { useMemo, useState } from "react";
import { Calendar, Sparkles, Users } from "lucide-react";
import {
  BookingItemCard,
  PublicBookingCardData,
} from "@/components/BookingItemCard";

type FilterMode = "all" | "upcoming" | "open";

export function BookingGalleryClient({
  bookings,
}: {
  bookings: PublicBookingCardData[];
}) {
  const [filter, setFilter] = useState<FilterMode>("all");

  const now = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filteredBookings = useMemo(() => {
    if (filter === "upcoming") {
      return bookings.filter((b) => new Date(b.endDate) >= now);
    }
    if (filter === "open") {
      return bookings.filter(
        (b) =>
          new Date(b.endDate) >= now && (b.maxGuests ?? 1) > (b.numGuests ?? 1)
      );
    }
    return bookings;
  }, [bookings, filter, now]);

  const upcomingCount = useMemo(
    () => bookings.filter((b) => new Date(b.endDate) >= now).length,
    [bookings, now]
  );

  const openSpotsCount = useMemo(
    () =>
      bookings.filter(
        (b) =>
          new Date(b.endDate) >= now && (b.maxGuests ?? 1) > (b.numGuests ?? 1)
      ).length,
    [bookings, now]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Lodge Trip Archive &amp; Schedule
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Resident Stays &amp; AI Emblems
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every approved and pending stay at KT Villa receives a bespoke seasonal art piece.
          </p>
        </div>

        {/* Filter Pills */}
        <div
          role="group"
          aria-label="Filter bookings"
          className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-1 shadow-sm"
        >
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/75 hover:bg-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            All Stays ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("upcoming")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "upcoming"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/75 hover:bg-muted hover:text-foreground"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Upcoming ({upcomingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("open")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "open"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/75 hover:bg-muted hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Open Spots ({openSpotsCount})
          </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
          <p className="text-base font-semibold text-foreground">
            No stays match this filter right now
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try switching back to All Stays or reserve the next open dates above!
          </p>
          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-4 inline-flex items-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Show All Stays
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBookings.map((booking) => (
            <BookingItemCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

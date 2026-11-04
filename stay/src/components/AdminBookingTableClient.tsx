"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { format } from "date-fns";
import {
  Cat,
  Check,
  CheckCircle2,
  Clock,
  Dog,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";

const UPDATE_BOOKING_MUTATION = gql`
  mutation AdminQuickUpdateBooking($id: Int!, $input: UpdateBookingInput!) {
    updateBooking(id: $id, input: $input) {
      id
      status
    }
  }
`;

const REGENERATE_IMAGE_MUTATION = gql`
  mutation AdminQuickRegenerateImage($bookingId: Int!) {
    regenerateBookingImage(bookingId: $bookingId) {
      id
      image
      text
    }
  }
`;

type StatusFilter = "all" | "pending" | "approved" | "other";

export function AdminBookingTableClient({ bookings }: { bookings: any[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [busyBookingId, setBusyBookingId] = useState<number | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

  const [updateBooking] = useMutation(UPDATE_BOOKING_MUTATION, {
    onCompleted: () => {
      setBusyBookingId(null);
      router.refresh();
    },
    onError: () => {
      setBusyBookingId(null);
    },
  });

  const [regenerateImage] = useMutation(REGENERATE_IMAGE_MUTATION, {
    onCompleted: () => {
      setRegeneratingId(null);
      router.refresh();
    },
    onError: () => {
      setRegeneratingId(null);
    },
  });

  const handleQuickStatus = (id: number, status: string) => {
    setBusyBookingId(id);
    updateBooking({
      variables: {
        id,
        input: { status },
      },
    });
  };

  const handleQuickRegenerate = (bookingId: number) => {
    setRegeneratingId(bookingId);
    regenerateImage({
      variables: { bookingId },
    });
  };

  const counts = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "pending").length;
    const approved = bookings.filter((b) => b.status === "approved").length;
    const other = bookings.filter(
      (b) => b.status !== "pending" && b.status !== "approved"
    ).length;
    return { all: bookings.length, pending, approved, other };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter === "pending" && b.status !== "pending") return false;
      if (statusFilter === "approved" && b.status !== "approved") return false;
      if (
        statusFilter === "other" &&
        (b.status === "pending" || b.status === "approved")
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = b.user?.name?.toLowerCase().includes(q);
        const emailMatch = b.user?.email?.toLowerCase().includes(q);
        const codeMatch = b.bookingCode?.toLowerCase().includes(q);
        return Boolean(nameMatch || emailMatch || codeMatch);
      }
      return true;
    });
  }, [bookings, statusFilter, search]);

  return (
    <div className="space-y-4">
      {/* Filter & Search Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/75 hover:bg-muted"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-foreground/75 hover:bg-muted"
            }`}
          >
            Pending Review ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "approved"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-foreground/75 hover:bg-muted"
            }`}
          >
            Approved ({counts.approved})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("other")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "other"
                ? "bg-stone-700 text-white shadow-sm"
                : "text-foreground/75 hover:bg-muted"
            }`}
          >
            Rejected / Cancelled ({counts.other})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by guest or code..."
            className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Responsive Table */}
      <div className="responsive-table-wrapper rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Emblem &amp; Guest</th>
              <th className="px-4 py-3">Stay Dates</th>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Quick Actions &amp; Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredBookings.map((booking) => {
              const isBusy = busyBookingId === booking.id;
              const isRegen = regeneratingId === booking.id;
              const start = new Date(booking.startDate);
              const end = new Date(booking.endDate);

              return (
                <tr
                  key={booking.id}
                  className="transition hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/public-booking/${booking.bookingCode}`}
                        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
                      >
                        {booking.item?.image ? (
                          <img
                            src={booking.item.image}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </Link>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground">
                          {booking.user?.name || "Unnamed User"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {booking.user?.email}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          #{booking.id} · {booking.bookingCode.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="font-semibold text-foreground">
                      {format(start, "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      to {format(end, "MMM d, yyyy")}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        {booking.numGuests}/{booking.maxGuests ?? booking.numGuests}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        guests
                      </span>
                      {booking.withDog && (
                        <span title="Dog">
                          <Dog className="h-3.5 w-3.5 text-primary" />
                        </span>
                      )}
                      {booking.withCat && (
                        <span title="Cat">
                          <Cat className="h-3.5 w-3.5 text-primary" />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        booking.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-800"
                          : booking.status === "pending"
                          ? "bg-amber-500/15 text-amber-800"
                          : "bg-red-500/15 text-red-800"
                      }`}
                    >
                      {booking.status === "approved" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : booking.status === "pending" ? (
                        <Clock className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {booking.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {booking.status !== "approved" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            handleQuickStatus(booking.id, "approved")
                          }
                          title="Approve booking"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </button>
                      )}

                      {booking.status !== "rejected" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            handleQuickStatus(booking.id, "rejected")
                          }
                          title="Reject booking"
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isRegen}
                        onClick={() => handleQuickRegenerate(booking.id)}
                        title="Regenerate fresh seasonal AI artwork"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 text-primary ${
                            isRegen ? "animate-spin" : ""
                          }`}
                        />
                        <span className="hidden xl:inline">Regen Art</span>
                      </button>

                      <Link
                        href={`/admin/booking/${booking.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Override
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

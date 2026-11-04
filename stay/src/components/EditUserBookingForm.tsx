"use client";

import { useState } from "react";
import Link from "next/link";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Cat,
  Dog,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";

const UPDATE_BOOKING_MUTATION = gql`
  mutation UpdateBooking($id: Int!, $input: UpdateBookingInput!) {
    updateBooking(id: $id, input: $input) {
      id
      startDate
      endDate
      maxGuests
      numGuests
      withCat
      withDog
      bookingCode
      status
      item {
        id
        image
        text
      }
    }
  }
`;

const GUEST_OPTIONS = [1, 2, 3, 4, 5];

export function EditUserBookingForm({ userBooking }: { userBooking: any }) {
  const router = useRouter();

  const [numGuests, setNumGuests] = useState<number>(
    userBooking?.numGuests ?? 2
  );
  const [maxGuests, setMaxGuests] = useState<number>(
    userBooking?.maxGuests ?? 4
  );
  const [withCat, setWithCat] = useState<boolean>(
    Boolean(userBooking?.withCat)
  );
  const [withDog, setWithDog] = useState<boolean>(
    Boolean(userBooking?.withDog)
  );

  const [updateBooking, { loading, error }] = useMutation(
    UPDATE_BOOKING_MUTATION,
    {
      onCompleted: () => {
        router.push(`/booking/${userBooking.bookingCode}`);
        router.refresh();
      },
    }
  );

  const handleSelectKnownGuests = (count: number) => {
    setNumGuests(count);
    if (maxGuests < count) {
      setMaxGuests(count);
    }
  };

  const handleSelectMaxGuests = (count: number) => {
    setMaxGuests(count);
    if (numGuests > count) {
      setNumGuests(count);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBooking({
      variables: {
        id: userBooking.id,
        input: {
          numGuests,
          maxGuests,
          withCat,
          withDog,
        },
      },
    });
  };

  const handleCancelStay = () => {
    updateBooking({
      variables: {
        id: userBooking.id,
        input: {
          status: "cancelled",
        },
      },
    });
  };

  const start = new Date(userBooking.startDate);
  const end = new Date(userBooking.endDate);
  const imageSrc = userBooking?.item?.image || "/img/house.png";

  return (
    <div className="alpine-container space-y-8 py-8 lg:py-12">
      <div className="flex items-center justify-between">
        <Link
          href={`/booking/${userBooking.bookingCode}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Your Trip Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Artwork & Dates Summary */}
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="aspect-square w-full bg-muted">
              <img
                src={imageSrc}
                alt={`Trip Emblem for ${userBooking.bookingCode}`}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-2 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Reserved Dates
              </p>
              <p className="flex items-center gap-2 text-base font-bold text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                {format(start, "MMM d, yyyy")} – {format(end, "MMM d, yyyy")}
              </p>
              <p className="text-xs text-muted-foreground">
                Need to change your check-in or check-out dates? Reach out to an
                admin or cancel and book a new window.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Edit Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="border-b border-border pb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Update Trip Settings
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                Edit Guest Count &amp; Pets
              </h1>
            </div>

            {/* Known Guests */}
            <fieldset className="space-y-2">
              <div className="flex items-center justify-between">
                <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirmed Guests in Your Group
                </legend>
                <span className="text-xs font-medium text-foreground">
                  {numGuests} {numGuests === 1 ? "guest" : "guests"}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {GUEST_OPTIONS.map((count) => {
                  const active = numGuests === count;
                  return (
                    <label
                      key={`edit-known-${count}`}
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-xl border py-2.5 text-sm font-semibold transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      )}
                    >
                      <input
                        type="radio"
                        name="numGuests"
                        value={count}
                        checked={active}
                        onChange={() => handleSelectKnownGuests(count)}
                        className="sr-only"
                      />
                      {count}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Max Guests */}
            <fieldset className="space-y-2">
              <div className="flex items-center justify-between">
                <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Max Group Size (Total Spots Including Open Friends)
                </legend>
                <span className="text-xs font-medium text-foreground">
                  Up to {maxGuests} {maxGuests === 1 ? "guest" : "guests"}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {GUEST_OPTIONS.map((count) => {
                  const active = maxGuests === count;
                  return (
                    <label
                      key={`edit-max-${count}`}
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-xl border py-2.5 text-sm font-semibold transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      )}
                    >
                      <input
                        type="radio"
                        name="maxGuests"
                        value={count}
                        checked={active}
                        onChange={() => handleSelectMaxGuests(count)}
                        className="sr-only"
                      />
                      {count}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Pets */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bringing Pets?
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition",
                    withDog
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={withDog}
                    onChange={(e) => setWithDog(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                  <Dog className="h-4 w-4 shrink-0" />
                  <span>Bringing a Dog</span>
                </label>

                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition",
                    withCat
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={withCat}
                    onChange={(e) => setWithCat(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                  <Cat className="h-4 w-4 shrink-0" />
                  <span>Bringing a Cat</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
                {error.message || "Could not update booking."}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              {userBooking.status !== "cancelled" && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCancelStay}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Cancel Stay
                </button>
              )}

              <div className="ml-auto flex items-center gap-2">
                <Link
                  href={`/booking/${userBooking.bookingCode}`}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                >
                  Discard
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

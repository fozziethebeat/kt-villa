"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { gql, TypedDocumentNode } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  startOfDay,
} from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Calendar as CalendarIcon,
  Cat,
  CheckCircle2,
  Dog,
  Loader2,
  Sparkles,
  Users,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  calendarDateToJstIso,
  getTodayInJstCalendarDate,
  jstToCalendarDate,
} from "@/lib/jst-date";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface FutureBookingWindow {
  startDate: string | Date;
  endDate: string | Date;
}

interface FutureBookingsData {
  futureBookings: FutureBookingWindow[];
}

export const QUERY: TypedDocumentNode<FutureBookingsData> = gql`
  query FutureBookings {
    futureBookings {
      startDate
      endDate
    }
  }
`;

const CREATE_BOOKING_MUTATION = gql`
  mutation CreateBookingMutation($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      bookingCode
    }
  }
`;

const GUEST_OPTIONS = [1, 2, 3, 4, 5];

export function BookingForm({
  initialFutureBookings,
}: {
  initialFutureBookings?: FutureBookingWindow[];
}) {
  const router = useRouter();

  // Only fetch on the client if server-provided bookings were not passed
  const { data } = useQuery(QUERY, {
    skip: Boolean(initialFutureBookings),
  });

  const futureBookings = initialFutureBookings ?? data?.futureBookings ?? [];
  const today = useMemo(() => getTodayInJstCalendarDate(), []);

  const excludedIntervals = useMemo(
    () =>
      futureBookings.map(({ startDate, endDate }) => ({
        start: jstToCalendarDate(startDate),
        end: jstToCalendarDate(endDate),
      })),
    [futureBookings]
  );

  const isRangeValid = (start?: Date, end?: Date) => {
    if (!start || !end) return false;
    const s = startOfDay(start);
    const e = startOfDay(end);
    if (isBefore(s, today)) return false;
    if (differenceInCalendarDays(e, s) < 1) return false;
    // Allow same-day turnovers (s === ex.end or e === ex.start); reject only night overlaps
    return !excludedIntervals.some((ex) => s < ex.end && e > ex.start);
  };

  // Find the nearest available 3-night window so the form starts ready to book
  const initialRange = useMemo<DateRange>(() => {
    for (let offset = 1; offset <= 180; offset++) {
      const candidateStart = addDays(today, offset);
      const candidateEnd = addDays(candidateStart, 3);
      if (
        !excludedIntervals.some(
          (ex) => candidateStart < ex.end && candidateEnd > ex.start
        )
      ) {
        return { from: candidateStart, to: candidateEnd };
      }
    }
    return { from: addDays(today, 1), to: addDays(today, 4) };
  }, [today, excludedIntervals]);

  const [date, setDate] = useState<DateRange | undefined>(initialRange);
  const [numGuests, setNumGuests] = useState<number>(2);
  const [maxGuests, setMaxGuests] = useState<number>(4);
  const [withCat, setWithCat] = useState<boolean>(false);
  const [withDog, setWithDog] = useState<boolean>(false);

  const isValidDates = isRangeValid(date?.from, date?.to);
  const nights =
    date?.from && date?.to
      ? Math.max(0, differenceInCalendarDays(date.to, date.from))
      : 0;

  const hasSameDayTurnover = useMemo(() => {
    if (!date?.from || !date?.to || !isValidDates) return false;
    const s = startOfDay(date.from).getTime();
    const e = startOfDay(date.to).getTime();
    return excludedIntervals.some(
      (ex) => ex.end.getTime() === s || ex.start.getTime() === e
    );
  }, [date, isValidDates, excludedIntervals]);

  const [createBooking, { loading, error }] = useMutation(
    CREATE_BOOKING_MUTATION,
    {
      onCompleted: (res: any) => {
        if (res?.createBooking?.bookingCode) {
          router.push(`/booking/${res.createBooking.bookingCode}`);
        }
      },
    }
  );

  const isDateDisabled = (candidate: Date) => {
    const c = startOfDay(candidate);
    if (isBefore(c, today)) return true;
    // Strictly interior days of any booking cannot be check-in or check-out
    const isInterior = excludedIntervals.some(
      ({ start, end }) => c > start && c < end
    );
    if (isInterior) return true;
    // A day that is both an existing check-out AND an existing check-in is completely full
    const t = c.getTime();
    const hasEndingHere = excludedIntervals.some(
      ({ end }) => end.getTime() === t
    );
    const hasStartingHere = excludedIntervals.some(
      ({ start }) => start.getTime() === t
    );
    return hasEndingHere && hasStartingHere;
  };

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
    if (!date?.from || !date?.to || !isValidDates) return;
    createBooking({
      variables: {
        input: {
          startDate: calendarDateToJstIso(date.from),
          endDate: calendarDateToJstIso(date.to),
          numGuests,
          maxGuests,
          withCat,
          withDog,
        },
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Reserve Your Stay
          </h2>
          <p className="text-xs text-muted-foreground">
            Pick open dates &amp; generate your custom trip emblem
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          ¥5,000 / night
        </span>
      </div>

      {/* Date Range Picker */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="booking-date-trigger"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Check-in &amp; Check-out (JST)
          </label>
          {isValidDates && nights > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {nights} {nights === 1 ? "night" : "nights"} available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" />
              Select non-overlapping dates
            </span>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="booking-date-trigger"
              type="button"
              variant="outline"
              className={cn(
                "h-11 w-full justify-between rounded-xl border-border bg-background px-3.5 text-left text-sm font-medium shadow-sm hover:bg-muted/60",
                !date && "text-muted-foreground"
              )}
            >
              <span className="flex items-center gap-2.5 truncate">
                <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
                {date?.from ? (
                  date.to ? (
                    <span>
                      {format(date.from, "MMM d, yyyy")} –{" "}
                      {format(date.to, "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span>{format(date.from, "MMM d, yyyy")} – Select end</span>
                  )
                ) : (
                  <span>Choose your dates</span>
                )}
              </span>
              <span className="ml-2 shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                Change
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto rounded-2xl border-border bg-card p-3 shadow-xl"
            align="end"
          >
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              disabled={isDateDisabled}
              /* @ts-ignore */
              excludeDisabled
              footer={
                <div className="mt-2 flex items-center justify-between gap-4 border-t border-border pt-2 text-xs text-muted-foreground">
                  <span>Same-day check-in/out turnovers are allowed</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-semibold",
                      isValidDates
                        ? "bg-emerald-500/15 text-emerald-800"
                        : "bg-amber-500/15 text-amber-800"
                    )}
                  >
                    {isValidDates ? "Dates Available" : "Select Valid Range"}
                  </span>
                </div>
              }
            />
          </PopoverContent>
        </Popover>
        {hasSameDayTurnover && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-900">
            Same-day turnover selected — we&apos;ll email the adjacent guest(s)
            with a checkout &amp; laundry heads-up.
          </p>
        )}
      </div>

      {/* Known Guests (Radio Pill Group) */}
      <fieldset className="space-y-1.5">
        <div className="flex items-center justify-between">
          <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Confirmed Guests Now
          </legend>
          <span className="text-xs text-muted-foreground">
            {numGuests} {numGuests === 1 ? "person" : "people"}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {GUEST_OPTIONS.map((count) => {
            const active = numGuests === count;
            return (
              <label
                key={`known-${count}`}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-xl border py-2 text-sm font-semibold transition",
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

      {/* Max Guests Open to Friends (Radio Pill Group) */}
      <fieldset className="space-y-1.5">
        <div className="flex items-center justify-between">
          <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Max Group Size (Open Spots)
          </legend>
          <span className="text-xs text-muted-foreground">
            Up to {maxGuests} {maxGuests === 1 ? "guest" : "guests"}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {GUEST_OPTIONS.map((count) => {
            const active = maxGuests === count;
            return (
              <label
                key={`max-${count}`}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-xl border py-2 text-sm font-semibold transition",
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

      {/* Pets Checkboxes */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <label
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition",
            withDog
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-foreground/80 hover:bg-muted"
          )}
        >
          <input
            type="checkbox"
            checked={withDog}
            onChange={(e) => setWithDog(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
          />
          <Dog className="h-4 w-4 shrink-0" />
          <span>Bringing a Dog</span>
        </label>

        <label
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition",
            withCat
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-foreground/80 hover:bg-muted"
          )}
        >
          <input
            type="checkbox"
            checked={withCat}
            onChange={(e) => setWithCat(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
          />
          <Cat className="h-4 w-4 shrink-0" />
          <span>Bringing a Cat</span>
        </label>
      </div>

      {/* Cost Preview & Submit */}
      <div className="space-y-3 border-t border-border/80 pt-3">
        {isValidDates && nights > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              Est. house contribution ({nights}n × {numGuests}g)
            </span>
            <span className="font-semibold text-foreground">
              ¥{(nights * numGuests * 5000).toLocaleString()}
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error.message || "Could not create booking. Please check your dates."}
          </div>
        )}

        <button
          type="submit"
          disabled={!isValidDates || loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Crafting AI Emblem &amp; Reserving...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Request Booking</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

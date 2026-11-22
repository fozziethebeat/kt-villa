"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Cat,
  CheckCircle2,
  Dog,
  ExternalLink,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  calendarDateToJstIso,
  jstToCalendarDate,
} from "@/lib/jst-date";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

const UPDATE_BOOKING_MUTATION = gql`
  mutation AdminUpdateBooking($id: Int!, $input: UpdateBookingInput!) {
    updateBooking(id: $id, input: $input) {
      id
      status
      startDate
      endDate
      numGuests
      maxGuests
      withCat
      withDog
    }
  }
`;

const REGENERATE_BOOKING_IMAGE_MUTATION = gql`
  mutation AdminRegenerateBookingImage(
    $bookingId: Int!
    $adapterId: Int
    $customPrompt: String
  ) {
    regenerateBookingImage(
      bookingId: $bookingId
      adapterId: $adapterId
      customPrompt: $customPrompt
    ) {
      id
      image
      text
      style
      season
      subject
    }
  }
`;

const GUEST_OPTIONS = [1, 2, 3, 4, 5];
const STATUS_OPTIONS = ["approved", "pending", "rejected", "cancelled"];

export function EditAdminBookingForm({
  booking,
  users = [],
  adapters = [],
}: {
  booking: any;
  users?: any[];
  adapters?: any[];
}) {
  const router = useRouter();

  const [startDate, setStartDate] = useState<Date>(() =>
    jstToCalendarDate(booking.startDate)
  );
  const [endDate, setEndDate] = useState<Date>(() =>
    jstToCalendarDate(booking.endDate)
  );
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [numGuests, setNumGuests] = useState<number>(booking.numGuests ?? 2);
  const [maxGuests, setMaxGuests] = useState<number>(booking.maxGuests ?? 4);
  const [withCat, setWithCat] = useState<boolean>(Boolean(booking.withCat));
  const [withDog, setWithDog] = useState<boolean>(Boolean(booking.withDog));
  const [status, setStatus] = useState<string>(booking.status || "pending");
  const [userId, setUserId] = useState<string>(booking.userId || "");
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Creative AI Regeneration controls (Admin-only)
  const [selectedAdapterId, setSelectedAdapterId] = useState<string>("auto");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [currentItem, setCurrentItem] = useState<any>(booking.item || null);

  const [updateBooking, { loading, error }] = useMutation(
    UPDATE_BOOKING_MUTATION,
    {
      onCompleted: () => {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
        router.refresh();
      },
    }
  );

  const [
    regenerateImage,
    { loading: regenLoading, error: regenError },
  ] = useMutation(REGENERATE_BOOKING_IMAGE_MUTATION, {
    onCompleted: (res: any) => {
      if (res?.regenerateBookingImage) {
        setCurrentItem(res.regenerateBookingImage);
      }
      router.refresh();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBooking({
      variables: {
        id: booking.id,
        input: {
          startDate: calendarDateToJstIso(startDate),
          endDate: calendarDateToJstIso(endDate),
          numGuests,
          maxGuests,
          withCat,
          withDog,
          status,
          userId,
        },
      },
    });
  };

  const handleRegenerateArtwork = () => {
    regenerateImage({
      variables: {
        bookingId: booking.id,
        adapterId:
          selectedAdapterId !== "auto"
            ? parseInt(selectedAdapterId, 10)
            : undefined,
        customPrompt: customPrompt.trim() ? customPrompt.trim() : undefined,
      },
    });
  };

  const imageSrc = currentItem?.image || "/img/house.png";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin?view=bookings"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Bookings
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/public-booking/${booking.bookingCode}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
            Public Page
          </Link>
          <Link
            href={`/booking/${booking.bookingCode}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
            Owner View
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Booking Override Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Admin Booking Override #{booking.id}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {booking.user?.name || "Guest"}&apos;s Stay
                </h1>
                <p className="font-mono text-xs text-muted-foreground">
                  Code: {booking.bookingCode}
                </p>
              </div>

              {savedNotice && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved!
                </span>
              )}
            </div>

            {/* Status Segmented Control */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Booking Status
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STATUS_OPTIONS.map((st) => {
                  const active = status === st;
                  return (
                    <label
                      key={st}
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-xl border py-2.5 text-xs font-semibold capitalize transition",
                        active
                          ? st === "approved"
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                            : st === "pending"
                            ? "border-amber-600 bg-amber-600 text-white shadow-sm"
                            : "border-red-600 bg-red-600 text-white shadow-sm"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      )}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={st}
                        checked={active}
                        onChange={() => setStatus(st)}
                        className="sr-only"
                      />
                      {st}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Assigned User (Host) */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-booking-user"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Assigned Guest (Owner)
              </label>
              {users.length > 0 ? (
                <select
                  id="admin-booking-user"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name || "Unnamed"} ({u.email}) — {u.id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="admin-booking-user"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground"
                />
              )}
            </div>

            {/* Check-in & Check-out Date Pickers (JST) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Check-in Date (JST)
                </label>
                <Popover
                  open={startPickerOpen}
                  onOpenChange={setStartPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full justify-start rounded-xl border-input bg-background text-left text-sm font-medium"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {startDate ? format(startDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto rounded-2xl border-border bg-card p-2 shadow-xl"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      defaultMonth={startDate}
                      selected={startDate}
                      onSelect={(d) => {
                        if (d) {
                          setStartDate(d);
                          setStartPickerOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Check-out Date (JST)
                </label>
                <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full justify-start rounded-xl border-input bg-background text-left text-sm font-medium"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {endDate ? format(endDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto rounded-2xl border-border bg-card p-2 shadow-xl"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      defaultMonth={endDate || startDate}
                      selected={endDate}
                      onSelect={(d) => {
                        if (d) {
                          setEndDate(d);
                          setEndPickerOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Guest Counts */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirmed Guests ({numGuests})
                </legend>
                <div className="grid grid-cols-5 gap-1.5">
                  {GUEST_OPTIONS.map((n) => (
                    <label
                      key={`admin-num-${n}`}
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-xl border py-2 text-sm font-semibold transition",
                        numGuests === n
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      )}
                    >
                      <input
                        type="radio"
                        name="numGuests"
                        value={n}
                        checked={numGuests === n}
                        onChange={() => setNumGuests(n)}
                        className="sr-only"
                      />
                      {n}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-1.5">
                <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Max Capacity ({maxGuests})
                </legend>
                <div className="grid grid-cols-5 gap-1.5">
                  {GUEST_OPTIONS.map((n) => (
                    <label
                      key={`admin-max-${n}`}
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-xl border py-2 text-sm font-semibold transition",
                        maxGuests === n
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      )}
                    >
                      <input
                        type="radio"
                        name="maxGuests"
                        value={n}
                        checked={maxGuests === n}
                        onChange={() => setMaxGuests(n)}
                        className="sr-only"
                      />
                      {n}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Pets */}
            <div className="grid grid-cols-2 gap-3">
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition",
                  withDog
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                <input
                  type="checkbox"
                  checked={withDog}
                  onChange={(e) => setWithDog(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Dog className="h-4 w-4" />
                <span>With Dog</span>
              </label>

              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition",
                  withCat
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                <input
                  type="checkbox"
                  checked={withCat}
                  onChange={(e) => setWithCat(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Cat className="h-4 w-4" />
                <span>With Cat</span>
              </label>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
                {error.message || "Failed to update booking."}
              </div>
            )}

            <div className="flex justify-end border-t border-border pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save Booking Override</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Admin AI Emblem Studio */}
        <div className="space-y-6 lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative aspect-square w-full bg-muted">
              <img
                src={imageSrc}
                alt={`AI Emblem for booking #${booking.id}`}
                className="h-full w-full object-cover"
              />
              {currentItem?.season && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  {currentItem.season}
                </span>
              )}
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Admin Creative AI Studio
                </p>
                <h2 className="mt-0.5 text-lg font-bold text-foreground">
                  Trip Emblem &amp; Art Direction
                </h2>
                {currentItem?.text && (
                  <p className="mt-2 rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                    {currentItem.text}
                  </p>
                )}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-adapter-select"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Style Adapter Selection
                  </label>
                  <select
                    id="admin-adapter-select"
                    value={selectedAdapterId}
                    onChange={(e) => setSelectedAdapterId(e.target.value)}
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="auto">
                      ✨ Seasonal Auto-Director (Non-Repeating)
                    </option>
                    {adapters.map((a: any) => (
                      <option key={a.id} value={String(a.id)}>
                        #{a.id} · {a.adapter} ({a.promptTemplate.slice(0, 42)}…)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-custom-prompt"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Optional Custom Prompt Override
                  </label>
                  <textarea
                    id="admin-custom-prompt"
                    rows={2}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Leave blank to let Gemini compose a seasonal Hakuba prompt, or type a custom scene..."
                    className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {regenError && (
                  <p className="text-xs text-destructive">
                    {regenError.message || "Could not regenerate image."}
                  </p>
                )}

                <button
                  type="button"
                  disabled={regenLoading}
                  onClick={handleRegenerateArtwork}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      regenLoading ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {regenLoading
                      ? "Generating Fresh Emblem..."
                      : "Regenerate AI Artwork"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

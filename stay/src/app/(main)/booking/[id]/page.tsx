import { redirect } from "next/navigation";
import Link from "next/link";
import { gql } from "@apollo/client";
import { differenceInCalendarDays, format } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Car,
  Cat,
  CheckCircle2,
  CheckSquare,
  Clock,
  CreditCard,
  Dog,
  ExternalLink,
  KeyRound,
  MapPin,
  Pencil,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { checkAccess } from "@/lib/auth-check";
import { getClient } from "@/graphql/ApolloClient";
import { MemberBookingForm } from "@/components/MemberBookingForm";
import { MemberRegisterForm } from "@/components/MemberRegisterForm";

const QUERY = gql`
  query BookingItemQuery($bookingCode: String!) {
    userBooking: userBooking(bookingCode: $bookingCode) {
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
        style
        season
        subject
      }
      member {
        id
        status
        user {
          name
        }
      }
    }
  }
`;

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkAccess("", "/signin");
  const { id } = await params;
  const session = await auth();
  const isAdmin = session?.user?.roles === "admin";

  let userBooking: any = null;
  try {
    const { data } = await getClient().query({
      query: QUERY,
      variables: { bookingCode: id },
      fetchPolicy: "no-cache",
    });
    userBooking = (data as any)?.userBooking;
  } catch {
    userBooking = null;
  }

  if (!userBooking) {
    redirect(`/public-booking/${id}`);
  }

  const start = new Date(userBooking.startDate);
  const end = new Date(userBooking.endDate);
  const nights = Math.max(1, differenceInCalendarDays(end, start));
  const openSpots = Math.max(
    0,
    (userBooking.maxGuests ?? 1) - (userBooking.numGuests ?? 1)
  );
  const totalEstimatedCost = nights * (userBooking.numGuests ?? 1) * 5000;
  const isApproved = userBooking.status === "approved";
  const imageSrc = userBooking?.item?.image || "/img/house.png";

  return (
    <div className="alpine-container space-y-8 py-8 lg:py-12">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/me"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            My Trips
          </Link>
          <span className="text-border">/</span>
          <span className="text-sm font-semibold text-foreground">
            Owner Trip Dashboard
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/public-booking/${userBooking.bookingCode}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
            Public Share Page
          </Link>

          <Link
            href={`/booking/${userBooking.bookingCode}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Guests &amp; Pets
          </Link>

          {isAdmin && (
            <Link
              href={`/admin/booking/${userBooking.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-500/25"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Override
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: AI Emblem & Quick House Guides */}
        <div className="space-y-6 lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
            <div className="relative aspect-square w-full bg-muted">
              <img
                src={imageSrc}
                alt={`AI Emblem for booking ${userBooking.bookingCode}`}
                className="h-full w-full object-cover"
              />
              {userBooking?.item?.season && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  {userBooking.item.season}
                </span>
              )}
            </div>

            {userBooking?.item && (
              <div className="space-y-2 border-t border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-primary">
                    Emblem #{userBooking.item.id}
                  </span>
                  {userBooking.item.style && (
                    <span className="text-muted-foreground">
                      {userBooking.item.style}
                    </span>
                  )}
                </div>
                {userBooking.item.text && (
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {userBooking.item.text}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Essential House Guide Links for the Trip Owner */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
              <BookOpen className="h-4 w-4" />
              Essential Pre-Trip Guides
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Please review these steps before arriving at KT Villa:
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Link
                href="/guide/the-stay/finding-the-house"
                className="flex items-center gap-2.5 rounded-xl border border-border bg-background p-3 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted"
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>1. Finding the House</span>
              </Link>
              <Link
                href="/guide/the-stay/arriving"
                className="flex items-center gap-2.5 rounded-xl border border-border bg-background p-3 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted"
              >
                <KeyRound className="h-4 w-4 shrink-0 text-primary" />
                <span>2. Water &amp; Warm-Up</span>
              </Link>
              <Link
                href="/guide/the-stay/car"
                className="flex items-center gap-2.5 rounded-xl border border-border bg-background p-3 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted"
              >
                <Car className="h-4 w-4 shrink-0 text-primary" />
                <span>3. Using House Car</span>
              </Link>
              <Link
                href="/guide/the-stay/departing"
                className="flex items-center gap-2.5 rounded-xl border border-border bg-background p-3 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted"
              >
                <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
                <span>4. Draining &amp; Checkout</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Private Trip Details, Cost & Co-Traveler Management */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isApproved
                    ? "bg-emerald-500/15 text-emerald-800"
                    : userBooking.status === "pending"
                    ? "bg-amber-500/15 text-amber-800"
                    : "bg-red-500/15 text-red-800"
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                <span className="capitalize">
                  Status: {userBooking.status}
                </span>
              </span>

              <span className="font-mono text-xs text-muted-foreground">
                Ref: {userBooking.bookingCode.slice(0, 8)}…
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Your Hakuba Trip Details
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isApproved
                ? "Your stay is approved! Make sure your co-travelers are registered below."
                : "Your booking request is pending approval from Keith or Jon."}
            </p>

            {/* Key Metrics Grid */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Stay Dates
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {nights} {nights === 1 ? "night" : "nights"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Guest Capacity
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>
                    {userBooking.numGuests} Confirmed / {userBooking.maxGuests}{" "}
                    Max
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {openSpots > 0
                    ? `${openSpots} open spot(s)`
                    : "At max capacity"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Est. Contribution
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>¥{totalEstimatedCost.toLocaleString()}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Link
                    href="/guide/the-stay/payment"
                    className="font-semibold text-primary hover:underline"
                  >
                    Payment instructions →
                  </Link>
                </p>
              </div>
            </div>

            {/* Pets Row */}
            {(userBooking.withDog || userBooking.withCat) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {userBooking.withDog && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground">
                    <Dog className="h-4 w-4 text-primary" />
                    Bringing a Dog
                  </span>
                )}
                {userBooking.withCat && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground">
                    <Cat className="h-4 w-4 text-primary" />
                    Bringing a Cat
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Co-Traveler & Join Request Management */}
          <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Co-Travelers &amp; Join Requests
                </h2>
                <p className="text-xs text-muted-foreground">
                  Add registered friends to your trip or approve friends who
                  requested to join.
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                {(userBooking.member ?? []).length} co-traveler(s) listed
              </span>
            </div>

            <MemberRegisterForm booking={userBooking} />

            {(userBooking.member ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/60 p-6 text-center text-xs text-muted-foreground">
                No co-travelers added yet. Share your{" "}
                <Link
                  href={`/public-booking/${userBooking.bookingCode}`}
                  className="font-semibold text-primary underline"
                >
                  Public Stay Link
                </Link>{" "}
                or add registered friends by name above.
              </div>
            ) : (
              <div className="responsive-table-wrapper rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Guest Name</th>
                      <th className="px-4 py-3 text-right">Status &amp; Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {userBooking.member.map((mb: any, index: number) => (
                      <tr key={mb.id || index}>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {mb.user?.name || "Guest"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <MemberBookingForm
                            memberBooking={mb}
                            booking={userBooking}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

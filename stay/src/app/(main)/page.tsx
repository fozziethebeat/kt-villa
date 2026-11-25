import Link from "next/link";
import {
  BookOpen,
  Car,
  Compass,
  Flame,
  KeyRound,
  MapPin,
  MountainSnow,
  Sparkles,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getStartOfTodayJstUtc } from "@/lib/jst-date";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/BookingForm";
import { NewUserForm } from "@/components/NewUserForm";
import { BookingItemGrid } from "@/components/BookingItemGrid";

export default async function Home() {
  const startOfToday = getStartOfTodayJstUtc();

  const [session, futureBookings] = await Promise.all([
    auth(),
    prisma.booking.findMany({
      where: {
        endDate: { gte: startOfToday },
        status: { in: ["pending", "approved"] },
      },
      select: {
        startDate: true,
        endDate: true,
      },
      orderBy: {
        startDate: "asc",
      },
    }),
  ]);

  const serializedFutureBookings = futureBookings
    .filter((b) => b.startDate && b.endDate)
    .map((b) => ({
      startDate: b.startDate!.toISOString(),
      endDate: b.endDate!.toISOString(),
    }));

  return (
    <div className="space-y-16 pb-16">
      {/* Hero & Quick Booking Split Section */}
      <section className="relative overflow-hidden border-b border-border/80 bg-stone-900 text-stone-100">
        {/* Background Image with Warm Alpine Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url(/img/background.png)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-stone-950/90 via-stone-900/75 to-emerald-950/80"
          aria-hidden="true"
        />

        <div className="alpine-container relative z-10 py-12 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Alpine Story & Quick Guide Links */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-amber-200 backdrop-blur-md">
                <MountainSnow className="h-4 w-4 text-amber-300" />
                <span>Hakuba Kamishiro · Nagano, Japan</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.08]">
                A Warm Mountain Basecamp in the Japanese Alps.
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-stone-200/90 sm:text-lg">
                Tucked in quiet Kamishiro woods just 1km from{" "}
                <strong className="font-semibold text-white">Hakuba 47</strong>{" "}
                and 2km from{" "}
                <strong className="font-semibold text-white">
                  Hakuba Goryu
                </strong>
                . Check open dates on the live calendar, reserve a stay with
                friends, or join an upcoming trip with open spots.
              </p>

              {/* Key Perks Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                <Link
                  href="/guide/the-stay/finding-the-house"
                  className="group flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-white/25 hover:bg-white/10"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-xs font-bold text-white group-hover:underline">
                      Finding the House
                    </p>
                    <p className="text-[11px] text-stone-300">
                      Maps, train &amp; access
                    </p>
                  </div>
                </Link>

                <Link
                  href="/guide/the-stay/arriving"
                  className="group flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-white/25 hover:bg-white/10"
                >
                  <Flame className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-xs font-bold text-white group-hover:underline">
                      Arrival &amp; Warm-up
                    </p>
                    <p className="text-[11px] text-stone-300">
                      Water, heaters &amp; keys
                    </p>
                  </div>
                </Link>

                <Link
                  href="/guide/the-stay/the-car"
                  className="group flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-white/25 hover:bg-white/10"
                >
                  <Car className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-xs font-bold text-white group-hover:underline">
                      House 4WD Car
                    </p>
                    <p className="text-[11px] text-stone-300">
                      Snow driving &amp; rules
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive Quick Booking / Onboarding / Sign-In Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl sm:p-7">
                {session ? (
                  session.user?.name ? (
                    <BookingForm
                      initialFutureBookings={serializedFutureBookings}
                    />
                  ) : (
                    <NewUserForm />
                  )
                ) : (
                  <div className="space-y-5 text-left">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          <Sparkles className="h-3 w-3" />
                          Friends &amp; Guests Portal
                        </span>
                        <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">
                          Ready for a Hakuba Trip?
                        </h2>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Sign in to check live date availability, book a new stay
                      for your crew, or request to join a friend&apos;s upcoming
                      trip.
                    </p>

                    <ul className="space-y-2 text-xs text-foreground/85">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>
                          Pick any open non-overlapping dates on the calendar
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>
                          Every stay gets a custom seasonal AI artwork emblem
                        </span>
                      </li>
                    </ul>

                    <div className="space-y-2.5 pt-2">
                      <Link
                        href="/signin"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                      >
                        <KeyRound className="h-4 w-4" />
                        <span>Sign In to Book or Join a Stay</span>
                      </Link>
                      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                        <Link
                          href="/guide"
                          className="font-medium text-primary hover:underline"
                        >
                          Read the House Guide →
                        </Link>
                        <Link
                          href="/about"
                          className="font-medium hover:text-foreground hover:underline"
                        >
                          About KT Villa
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Approved & Pending Bookings Gallery */}
      <section className="alpine-container">
        <BookingItemGrid />
      </section>

      {/* Bottom House Guide Banner */}
      <section className="alpine-container">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Essential Guest Resources
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                First time staying at KT Villa?
              </h2>
              <p className="text-sm text-muted-foreground">
                Because the lodge sits in snow country, turning on the water
                valves on arrival and draining the pipes before departure is
                super important. Check out our step-by-step guides before your
                trip.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/guide/the-stay/finding-the-house"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
              >
                <MapPin className="h-4 w-4 text-primary" />
                Directions &amp; Map
              </Link>
              <Link
                href="/guide/the-stay/arriving"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
              >
                <BookOpen className="h-4 w-4 text-primary" />
                Arrival Checklist
              </Link>
              <Link
                href="/guide/the-village"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <Compass className="h-4 w-4" />
                Explore Hakuba Guide
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

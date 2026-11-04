import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Coffee,
  Flame,
  MapPin,
  MountainSnow,
  Sparkles,
  Train,
} from "lucide-react";

const GALLERY_PHOTOS = [
  {
    src: "/about/view-hakuba-mountains.jpeg",
    caption: "Northern Alps peaks towering over Hakuba Valley",
  },
  {
    src: "/about/location-house-snow.jpeg",
    caption: "KT Villa tucked into deep Kamishiro winter snow",
  },
  {
    src: "/about/view-hakuba-valley.jpeg",
    caption: "Morning views across the valley floor",
  },
  {
    src: "/about/location-snowy-yard.jpeg",
    caption: "Fresh powder outside the front deck",
  },
];

const PERK_PHOTOS = [
  {
    src: "/about/perks-fireplace.jpeg",
    title: "Wood-Burning Stove",
    desc: "Warm up after a powder day by our cast-iron wood stove in the living room.",
  },
  {
    src: "/about/perks-mame.jpeg",
    title: "Mame the Lodge Mascot",
    desc: "On select trips, our sweet pup Mame joins the mountain crew.",
  },
  {
    src: "/about/perks-mushrooms.jpeg",
    title: "Four-Season Alpine Living",
    desc: "From deep winter powder to green-season foraging and mountain hikes.",
  },
];

export default function About() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-border bg-stone-900 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: "url(/about/view-hakuba-main.jpeg)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/60 to-stone-900/40"
          aria-hidden="true"
        />

        <div className="alpine-container relative z-10 py-20 lg:py-28">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur-md">
              <MountainSnow className="h-4 w-4 text-amber-300" />
              Kamishiro · Hakuba Valley, Nagano
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Our Home in the Japanese Alps.
            </h1>
            <p className="text-base leading-relaxed text-stone-200 sm:text-lg">
              Each season we open up our Hakuba lodge,{" "}
              <strong className="font-semibold text-white">KT Villa</strong>, to
              friends and friends of friends. Pick an open window on the
              calendar or join an upcoming trip to enjoy deep snow, mountain air,
              and cozy nights by the fire.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <Calendar className="h-4 w-4" />
                Check Availability &amp; Book
              </Link>
              <Link
                href="/guide"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <BookOpen className="h-4 w-4" />
                Read the House Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect & Location */}
      <section className="alpine-container space-y-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Location &amp; Setting
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Right Between Hakuba 47 &amp; Goryu
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            KT Villa sits in quiet Kamishiro forest about{" "}
            <strong className="text-foreground">1 kilometer from Hakuba 47</strong>{" "}
            and{" "}
            <strong className="text-foreground">2 kilometers from Hakuba Goryu</strong>
            — two of the best interconnected ski resorts in Japan. Winter
            temperatures regularly dip between 0°C and -15°C, bringing legendary
            Nagano powder snow right to the doorstep.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {GALLERY_PHOTOS.map((photo) => (
            <figure
              key={photo.src}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={photo.src}
                  alt={photo.caption}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                />
              </div>
              <figcaption className="p-3.5 text-xs font-medium text-muted-foreground">
                {photo.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Lodge Perks */}
      <section className="alpine-container space-y-8">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Inside the Lodge
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Cozy Perks for Every Trip
          </h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ve outfitted the house with a wood stove, an espresso bar, a
            full kitchen, standing desks for remote work, and a movie projector.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PERK_PHOTOS.map((perk) => (
            <div
              key={perk.src}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={perk.src}
                  alt={perk.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-1.5 p-5">
                <h3 className="text-lg font-bold text-foreground">
                  {perk.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {perk.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How to Join Steps */}
      <section className="alpine-container">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            How a Stay Works
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 rounded-xl border border-border bg-background p-4">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <h3 className="font-bold text-foreground">Sign In &amp; Onboard</h3>
              <p className="text-xs text-muted-foreground">
                Sign in with your email and fill in your name, referral, and
                messaging handle.
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-background p-4">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <h3 className="font-bold text-foreground">Pick Open Dates</h3>
              <p className="text-xs text-muted-foreground">
                Select non-overlapping dates on the home calendar or request to
                join an existing trip with open spots.
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-background p-4">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              <h3 className="font-bold text-foreground">
                Follow the House Manual
              </h3>
              <p className="text-xs text-muted-foreground">
                Use the Arrival Guide to unlock the keybox and turn on the water
                pump &amp; heaters.
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-background p-4">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                4
              </span>
              <h3 className="font-bold text-foreground">
                Leave It Better &amp; Settle Up
              </h3>
              <p className="text-xs text-muted-foreground">
                Drain the water pipes before checkout, drop off trash, and
                contribute ¥5,000/night toward house upkeep.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

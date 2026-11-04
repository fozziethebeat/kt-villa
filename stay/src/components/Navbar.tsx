import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Compass,
  Info,
  Mountain,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { AccountMenu } from "@/components/AccountMenu";

export async function Navbar() {
  const session = await auth();
  const isAdmin = session?.user?.roles === "admin";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="alpine-container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-foreground transition hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition group-hover:scale-105">
              <Mountain className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight leading-none">
                KT Villa
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Hakuba · Kamishiro
              </span>
            </div>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden md:flex md:items-center md:gap-1"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/85 transition hover:bg-muted hover:text-foreground"
            >
              <Calendar className="h-4 w-4 text-primary/80" />
              Stays &amp; Book
            </Link>
            <Link
              href="/guide"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/85 transition hover:bg-muted hover:text-foreground"
            >
              <BookOpen className="h-4 w-4 text-primary/80" />
              House Guide
            </Link>
            <Link
              href="/guide/the-village"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/85 transition hover:bg-muted hover:text-foreground"
            >
              <Compass className="h-4 w-4 text-primary/80" />
              The Village
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/85 transition hover:bg-muted hover:text-foreground"
            >
              <Info className="h-4 w-4 text-primary/80" />
              About
            </Link>
            {session && (
              <Link
                href="/me"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/85 transition hover:bg-muted hover:text-foreground"
              >
                <UserCheck className="h-4 w-4 text-primary/80" />
                My Trips
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/20"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Compact mobile quick-links */}
          <nav
            aria-label="Mobile quick links"
            className="flex items-center gap-1 md:hidden"
          >
            <Link
              href="/guide"
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted"
            >
              Guide
            </Link>
            <Link
              href="/about"
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted"
            >
              About
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary"
              >
                Admin
              </Link>
            )}
          </nav>

          {session ? (
            <AccountMenu />
          ) : (
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-muted/40 py-10 text-sm text-muted-foreground">
      <div className="alpine-container flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold text-foreground">
            KT Villa · Hakuba Kamishiro Lodge
          </p>
          <p className="mt-1 text-xs">
            1km from Hakuba 47 &amp; 2km from Hakuba Goryu · Nagano, Japan
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-xs font-medium">
          <Link href="/" className="transition hover:text-foreground">
            Book a Stay
          </Link>
          <Link
            href="/guide/the-stay/finding-the-house"
            className="transition hover:text-foreground"
          >
            Finding the House
          </Link>
          <Link
            href="/guide/the-stay/arriving"
            className="transition hover:text-foreground"
          >
            Arrival Guide
          </Link>
          <Link
            href="/guide/the-stay/departing"
            className="transition hover:text-foreground"
          >
            Checkout Checklist
          </Link>
          <Link
            href="/guide/the-village"
            className="transition hover:text-foreground"
          >
            Hakuba Village
          </Link>
          <Link href="/about" className="transition hover:text-foreground">
            About the Lodge
          </Link>
        </div>
      </div>
    </footer>
  );
}

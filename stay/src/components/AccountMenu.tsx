import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Compass,
  Home,
  LogOut,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";

export async function AccountMenu() {
  const session = await auth();
  if (!session?.user) {
    return (
      <Link
        href="/signin"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        Sign In
      </Link>
    );
  }

  const isAdmin = session.user.roles === "admin";
  const displayName =
    session.user.name || session.user.email?.split("@")[0] || "Guest";

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        tabIndex={0}
        aria-label="Open account menu"
        className="flex items-center gap-2.5 rounded-full border border-border bg-card py-1 pl-1.5 pr-3 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <img
          src={session.user.profileImageUrl}
          alt={displayName}
          className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
        />
        <span className="hidden max-w-[120px] truncate sm:inline">
          {displayName}
        </span>
        {isAdmin && (
          <span className="hidden rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary md:inline">
            Admin
          </span>
        )}
      </button>

      <div
        tabIndex={0}
        className="dropdown-content z-50 mt-2 w-64 rounded-xl border border-border bg-card p-2 text-card-foreground shadow-xl"
      >
        <div className="border-b border-border/70 px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-foreground">
            {displayName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {session.user.email}
          </p>
        </div>

        <ul className="py-1.5 text-sm">
          <li>
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-foreground transition hover:bg-muted"
            >
              <Home className="h-4 w-4 text-muted-foreground" />
              Book &amp; Stays
            </Link>
          </li>
          <li>
            <Link
              href="/me"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-foreground transition hover:bg-muted"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              My Trips &amp; Profile
            </Link>
          </li>
          <li>
            <Link
              href="/guide"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-foreground transition hover:bg-muted"
            >
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              House Guide
            </Link>
          </li>
          <li>
            <Link
              href="/guide/the-village"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-foreground transition hover:bg-muted"
            >
              <Compass className="h-4 w-4 text-muted-foreground" />
              Hakuba Village
            </Link>
          </li>
        </ul>

        {isAdmin && (
          <div className="border-t border-border/70 py-1.5">
            <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Admin Controls
            </div>
            <ul className="text-sm">
              <li>
                <Link
                  href="/admin?view=bookings"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-foreground transition hover:bg-muted"
                >
                  <Calendar className="h-4 w-4 text-primary" />
                  Manage Bookings
                </Link>
              </li>
              <li>
                <Link
                  href="/admin?view=users"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-foreground transition hover:bg-muted"
                >
                  <Users className="h-4 w-4 text-primary" />
                  Manage Users
                </Link>
              </li>
              <li>
                <Link
                  href="/admin?view=adapters"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-foreground transition hover:bg-muted"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Art Studio
                </Link>
              </li>
            </ul>
          </div>
        )}

        <div className="border-t border-border/70 pt-1.5">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { CalendarPlus, Mail, ShieldCheck, Sparkles } from "lucide-react";

import { auth } from "@/lib/auth";
import { EditUserDetails } from "@/components/EditUserDetails";

export async function UserDetails() {
  const session = await auth();
  if (!session?.user) return null;

  const user = {
    ...session.user,
    name: session.user.name,
    referral: session.user.referral ?? "",
    socialType: session.user.socialType ?? "instagram",
    socialHandle: session.user.socialHandle ?? "",
    trustStatus: session.user.trustStatus ?? "new",
    roles: session.user.roles ?? "general",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <img
            src={session.user.profileImageUrl}
            alt={user.name || "Guest Avatar"}
            className="h-16 w-16 rounded-2xl border border-border object-cover shadow-sm"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {user.name || "Mountain Guest"}
              </h1>
              {user.roles === "admin" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                <Sparkles className="h-3 w-3 text-amber-600" />
                {user.trustStatus} status
              </span>
            </div>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
              {user.socialHandle && (
                <>
                  <span>·</span>
                  <span className="capitalize">{user.socialType}:</span>
                  <span className="font-medium text-foreground">
                    {user.socialHandle}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <EditUserDetails user={user} />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Book New Stay
          </Link>
        </div>
      </div>
    </div>
  );
}

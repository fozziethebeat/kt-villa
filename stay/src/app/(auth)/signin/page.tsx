import Link from "next/link";
import { AuthError } from "next-auth";
import { ArrowLeft, Mail, Mountain, Sparkles } from "lucide-react";

import { signIn } from "@/lib/auth";

export default function SignInPage() {
  const handleSubmit = async (formData: FormData) => {
    "use server";
    try {
      await signIn("nodemailer", {
        redirectTo: "/",
        email: formData.get("email"),
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return;
      }
      throw error;
    }
  };

  return (
    <div className="alpine-container flex w-full justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Mountain className="h-6 w-6" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            Passwordless Magic Link
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Sign In to KT Villa
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Enter your email address and we&apos;ll send you a one-click sign-in
            link to book stays or view guest details.
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Send Sign-In Link
          </button>
        </form>

        <div className="border-t border-border pt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home &amp; Public Stays
          </Link>
        </div>
      </div>
    </div>
  );
}

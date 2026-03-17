"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Mail, KeyRound } from "lucide-react";

export function SignupForm(props: {
  searchParams?: { callbackUrl: string | undefined };
  magicCode?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const code = formData.get("magicCode") as string;

    try {
      await authClient.signIn.magicLink({
        email,
        callbackURL: props.searchParams?.callbackUrl || "/",
      }, {
        headers: {
          "x-magic-code": code
        },
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          setLoading(false);
          setSuccess(true);
        },
        onError: (ctx) => {
          setLoading(false);
          setError(ctx.error.message);
        }
      });
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "An error occurred");
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-brand-wine/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-brand-wine" />
        </div>
        <h2 className="text-xl font-serif font-semibold text-brand-deep">Check your email!</h2>
        <p className="text-sm text-brand-warm-gray">We've sent you a magic link to verify your account.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-wine to-brand-plum flex items-center justify-center text-2xl shadow-lg">
          🎵
        </div>
        <h1 className="text-2xl font-serif font-semibold text-brand-deep">Join Our Playlist</h1>
        <p className="text-sm text-brand-warm-gray">You'll need an invitation code</p>
      </div>

      {/* Signup Card */}
      <div className="rounded-2xl border border-border bg-card shadow-xl p-6 sm:p-8 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-brand-deep">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-warm-gray" />
              <input
                name="email"
                id="email"
                type="email"
                required
                placeholder="your@email.com"
                className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-wine/30 focus:border-brand-wine transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="magicCode" className="text-sm font-medium text-brand-deep">Invitation Code</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-warm-gray" />
              <input
                name="magicCode"
                id="magicCode"
                type="text"
                required
                placeholder="Enter your code"
                defaultValue={props?.magicCode ?? ''}
                className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-wine/30 focus:border-brand-wine transition-colors"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            className="w-full rounded-lg bg-brand-wine text-white font-medium py-2.5 text-sm hover:bg-brand-wine/90 disabled:opacity-50 transition-colors"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}

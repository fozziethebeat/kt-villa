"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Mail, Shield, User } from 'lucide-react';

const IS_DEV = process.env.NEXT_PUBLIC_DEV_LOGIN === "true";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [devLoading, setDevLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    try {
      await authClient.signIn.magicLink({
        email,
        callbackURL: "/",
      }, {
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

  const handleDevLogin = async (role: "admin" | "user") => {
    setDevLoading(role);
    setError(null);
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Login failed (${res.status})`);
      }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Dev login failed");
    } finally {
      setDevLoading(null);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center px-4 bg-gradient-to-br from-brand-wine-light via-brand-cream to-brand-plum-light">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-brand-wine/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-brand-wine" />
          </div>
          <h2 className="text-xl font-serif font-semibold text-brand-deep">Check your email!</h2>
          <p className="text-sm text-brand-warm-gray">We've sent you a magic link to sign in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen justify-center items-center px-4 bg-gradient-to-br from-brand-wine-light via-brand-cream to-brand-plum-light">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-wine to-brand-plum flex items-center justify-center text-2xl shadow-lg">
            🎵
          </div>
          <h1 className="text-2xl font-serif font-semibold text-brand-deep">Our Playlist Journey</h1>
          <p className="text-sm text-brand-warm-gray">Sign in with your email</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border bg-card shadow-xl p-6 sm:p-8 space-y-5">
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

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              className="w-full rounded-lg bg-brand-wine text-white font-medium py-2.5 text-sm hover:bg-brand-wine/90 disabled:opacity-50 transition-colors"
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Sign In"}
            </button>
          </form>

          <div className="text-center text-sm text-brand-warm-gray">
            New here? <Link href="/signup" className="text-brand-wine hover:text-brand-wine/80 font-medium transition-colors">Sign up</Link>
          </div>

          {/* Dev-only quick login */}
          {IS_DEV && (
            <div className="mt-4 pt-4 border-t border-dashed border-amber-300/60">
              <div className="flex items-center gap-2 mb-3 justify-center">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                  Dev Only
                </span>
              </div>
              <div className="grid gap-2">
                <button
                  id="dev-login-admin"
                  type="button"
                  onClick={() => handleDevLogin("admin")}
                  disabled={devLoading !== null}
                  className="w-full py-2 rounded-lg border-2 border-amber-300 bg-amber-50 text-amber-800 font-medium text-sm hover:bg-amber-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  {devLoading === "admin" ? "Logging in…" : "Login as Admin"}
                </button>
                <button
                  id="dev-login-user"
                  type="button"
                  onClick={() => handleDevLogin("user")}
                  disabled={devLoading !== null}
                  className="w-full py-2 rounded-lg border border-border bg-white/50 text-brand-warm-gray font-medium text-sm hover:bg-brand-cream transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4" />
                  {devLoading === "user" ? "Logging in…" : "Login as Test User"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

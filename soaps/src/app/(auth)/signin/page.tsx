"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

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
      <div className="flex min-h-screen justify-center items-center bg-gradient-to-br from-brand-terracotta-light via-brand-cream to-brand-rose-light">
        <div className="w-full max-w-sm mx-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-brand-terracotta/10 p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-sage-light mb-4">
            <svg className="w-6 h-6 text-brand-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-brand-warm-brown font-serif mb-2">Check your email</h2>
          <p className="text-brand-stone text-sm">We've sent you a magic link to sign in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center items-center bg-gradient-to-br from-brand-terracotta-light via-brand-cream to-brand-rose-light">
      <div className="w-full max-w-sm mx-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-brand-terracotta/10 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold font-serif text-brand-warm-brown mb-1">Welcome Back</h1>
          <p className="text-sm text-brand-stone">Sign in to KT Soaps</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium text-brand-warm-brown">Email</label>
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-stone/50">
                  <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                  <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                </svg>
                <input
                  name="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-terracotta/30 focus:border-brand-terracotta/50 outline-none transition-all text-sm"
                  id="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              className="w-full py-2.5 rounded-lg bg-brand-warm-brown text-brand-cream font-medium text-sm hover:bg-brand-warm-brown/90 transition-colors disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </button>
          </div>
        </form>
        <div className="text-sm mt-6 text-center text-brand-stone">
          New here? <Link href="/signup" className="text-brand-terracotta hover:text-brand-warm-brown font-medium transition-colors">Sign up</Link>
        </div>

        {/* Dev-only quick login */}
        {IS_DEV && (
          <div className="mt-6 pt-5 border-t border-dashed border-amber-300/60">
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
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                {devLoading ? "Logging in…" : "Login as Admin"}
              </button>
              <button
                id="dev-login-user"
                type="button"
                onClick={() => handleDevLogin("user")}
                disabled={devLoading !== null}
                className="w-full py-2 rounded-lg border border-border bg-white/50 text-brand-stone font-medium text-sm hover:bg-brand-cream transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {devLoading ? "Logging in…" : "Login as Test User"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

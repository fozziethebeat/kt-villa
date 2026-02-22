"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

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
      <div className="flex min-h-screen justify-center items-center bg-gradient-to-br from-brand-terracotta-light via-brand-cream to-brand-rose-light">
        <div className="w-full max-w-sm mx-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-brand-terracotta/10 p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-sage-light mb-4">
            <svg className="w-6 h-6 text-brand-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-brand-warm-brown font-serif mb-2">Check your email</h2>
          <p className="text-brand-stone text-sm">We've sent you a magic link to verify your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center items-center bg-gradient-to-br from-brand-terracotta-light via-brand-cream to-brand-rose-light">
      <div className="w-full max-w-sm mx-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-brand-terracotta/10 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold font-serif text-brand-warm-brown mb-1">Join KT Soaps</h1>
          <p className="text-sm text-brand-stone">Create your account to start collecting</p>
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
            <div className="grid gap-2">
              <label htmlFor="magicCode" className="text-sm font-medium text-brand-warm-brown">Invitation Code</label>
              <input
                name="magicCode"
                id="magicCode"
                type="text"
                required
                placeholder="Enter your invitation code"
                defaultValue={props?.magicCode ?? ''}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-terracotta/30 focus:border-brand-terracotta/50 outline-none transition-all text-sm font-mono"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              className="w-full py-2.5 rounded-lg bg-brand-warm-brown text-brand-cream font-medium text-sm hover:bg-brand-warm-brown/90 transition-colors disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

const IS_DEV = process.env.NEXT_PUBLIC_DEV_LOGIN === "true";

export default function SignInPage() {
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
        onRequest: () => setLoading(true),
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="mx-auto w-full max-w-[1360px] px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="text-[1.0625rem] font-semibold tracking-[-0.03em] text-foreground">
          Our Morning Sunset
        </Link>
        <Link href="/" className="text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors duration-150">
          Back to rack
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {success ? (
            <div className="border-t border-border pt-8 space-y-3">
              <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground">
                Check your email
              </h1>
              <p className="text-[1rem] text-muted-foreground leading-relaxed">
                We sent a sign-in link to your inbox. Open it on this device to continue.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground">
                  Sign in
                </h1>
                <p className="mt-2 text-[0.9375rem] text-muted-foreground">
                  Enter your email to receive a one-time sign-in link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-[0.875rem] font-medium text-foreground mb-2">
                    Email address
                  </label>
                  <input
                    name="email"
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="h-11 w-full border border-border bg-card px-4 text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors duration-150"
                  />
                </div>

                {error && <p className="text-[0.875rem] text-destructive">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-foreground text-background text-[0.9375rem] font-medium hover:bg-mineral-moss transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Sending link..." : "Send sign-in link"}
                </button>
              </form>

              <p className="mt-8 text-[0.875rem] text-muted-foreground">
                Have a batch invite code?{' '}
                <Link href="/signup" className="text-foreground underline underline-offset-4 decoration-border hover:text-mineral-moss transition-colors duration-150">
                  Create an account
                </Link>
              </p>

              {IS_DEV && (
                <div className="mt-10 pt-6 border-t border-border space-y-2.5">
                  <p className="text-[0.8125rem] font-medium text-muted-foreground">
                    Local development login
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      id="dev-login-admin"
                      type="button"
                      onClick={() => handleDevLogin("admin")}
                      disabled={devLoading !== null}
                      className="h-10 border border-foreground text-foreground text-[0.875rem] font-medium hover:bg-foreground hover:text-background transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                    >
                      {devLoading === "admin" ? "Signing in..." : "Admin"}
                    </button>
                    <button
                      id="dev-login-user"
                      type="button"
                      onClick={() => handleDevLogin("user")}
                      disabled={devLoading !== null}
                      className="h-10 border border-border text-muted-foreground text-[0.875rem] font-medium hover:border-foreground hover:text-foreground transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                    >
                      {devLoading === "user" ? "Signing in..." : "Test user"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

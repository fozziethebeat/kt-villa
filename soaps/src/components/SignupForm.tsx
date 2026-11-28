"use client";

import Link from "next/link";
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
      await authClient.signIn.magicLink(
        {
          email,
          callbackURL: props.searchParams?.callbackUrl || "/",
        },
        {
          headers: {
            "x-magic-code": code,
          },
          onRequest: () => setLoading(true),
          onSuccess: () => {
            setLoading(false);
            setSuccess(true);
          },
          onError: (ctx) => {
            setLoading(false);
            setError(ctx.error.message);
          },
        }
      );
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "An error occurred");
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
                We sent a sign-in link to verify your account and unlock your collection.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground">
                  Join Our Morning Sunset
                </h1>
                <p className="mt-2 text-[0.9375rem] text-muted-foreground">
                  Enter your email and batch invitation code to start your collection.
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

                <div>
                  <label htmlFor="magicCode" className="block text-[0.875rem] font-medium text-foreground mb-2">
                    Invitation code
                  </label>
                  <input
                    name="magicCode"
                    id="magicCode"
                    type="text"
                    required
                    placeholder="Enter your invitation code"
                    defaultValue={props?.magicCode ?? ""}
                    className="h-11 w-full border border-border bg-card px-4 text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors duration-150"
                  />
                </div>

                {error && <p className="text-[0.875rem] text-destructive">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-foreground text-background text-[0.9375rem] font-medium hover:bg-mineral-moss transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Sending link..." : "Create account"}
                </button>
              </form>

              <p className="mt-8 text-[0.875rem] text-muted-foreground">
                Already have an account?{" "}
                <Link href="/signin" className="text-foreground underline underline-offset-4 decoration-border hover:text-mineral-moss transition-colors duration-150">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

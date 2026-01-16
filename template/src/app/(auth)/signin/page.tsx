"use client";

import Link from 'next/link';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  if (success) {
    return (
      <div className="flex flex-row min-h-screen justify-center items-center">
        <div className="card bg-base-100 w-96 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-success">Check your email!</h2>
            <p>We've sent you a magic link to sign in.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row min-h-screen justify-center items-center">
      <div className="card bg-base-100 w-96 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Login to App</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="input input-bordered flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 w-4 opacity-70">
                    <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                    <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                  </svg>
                  <input
                    name="email"
                    className="grow"
                    id="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                  />
                </label>
              </div>
              {error && <p className="text-error text-sm">{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Login"}
              </button>
            </div>
          </form>
          <div className="text-sm mt-4">
            New user? <Link href="/signup" className="link link-primary">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

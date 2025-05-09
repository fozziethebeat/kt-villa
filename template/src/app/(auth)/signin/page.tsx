import Link from 'next/link';
import {redirect} from 'next/navigation';
import {AuthError} from 'next-auth';

import {signIn} from '@/lib/auth';

export default function Page() {
  const handleSubmit = async formData => {
    'use server';
    try {
      await signIn('nodemailer', {
        redirectTo: '/',
        email: formData.get('email'),
      });
    } catch (error) {
      if (error instanceof AuthError) {
      }
      throw error;
    }
  };
  return (
    <div className="flex flex-row min-h-screen justify-center items-center">
      <div className="card bg-base-100 w-96 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Login to App</h2>
          <form action={handleSubmit}>
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
              <button className="btn btn-primary" type="submit">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

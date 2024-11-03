import Link from 'next/link';

import {hasRole} from '@/lib/auth-check';
import {BookingForm} from '@/components/BookingForm';
import {BookingItemGrid} from '@/components/BookingItemGrid';

export default async function Home() {
  const canBook = await hasRole(['admin', 'trusted']);
  return (
    <div>
      <div
        className="hero min-h-screen bg-base-200"
        style={{
          backgroundImage:
            'url(https://www.hakubavalley.com/cms/wp-content/themes/hv_themes/common/img/top-bg-about.jpg)',
        }}>
        <div className="z-1 hero-content z-10 flex-col">
          <div className="lg:-left text-center text-neutral-content">
            <h1 className="text-5xl font-bold">Register for a stay!</h1>
            <p className="py-6">
              Join us for a long weekend in Hakuba!
              <Link href="/about"> Find out more</Link>
            </p>
          </div>
          <div className="card h-96 w-[400px] flex-shrink-0 bg-base-100 p-4 shadow-2xl">
            {canBook ? (
              <BookingForm />
            ) : (
              <button className="justify-center btn btn-primary">
                <Link href="/api/auth/signin">Sign In</Link>
              </button>
            )}
          </div>
        </div>
      </div>
      );
      <BookingItemGrid />
    </div>
  );
}

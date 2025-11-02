import Link from "next/link";

import { auth } from "@/lib/auth";
import { BookingForm } from "@/components/BookingForm";
import { NewUserForm } from "@/components/NewUserForm";
import { BookingItemGrid } from "@/components/BookingItemGrid";

export default async function Home() {
  const session = await auth();
  return (
    <div>
      <div
        className="hero min-h-screen bg-base-200"
        style={{
          backgroundImage: "url(/img/background.png)",
        }}
      >
        <div className="z-1 hero-content z-10 flex-col">
          <div className="lg:-left text-center">
            {!session?.user?.name ? (
              <>
                <h1 className="text-5xl font-bold">
                  Tell us a little about yourself
                </h1>
                <p className="py-6">Just so we can reach out with questions</p>
              </>
            ) : (
              <>
                <h1 className="text-5xl font-bold">Register for a stay!</h1>
                <p className="py-6">
                  Join us for a long weekend in Hakuba!
                  <Link href="/about"> Find out more</Link>
                </p>
              </>
            )}
          </div>
          <div className="card h-96 w-[400px] flex-shrink-0 bg-base-100 p-4 shadow-2xl flex items-center justify-center">
            {session ? (
              session?.user?.name ? (
                <BookingForm />
              ) : (
                <NewUserForm />
              )
            ) : (
              <Link href="/signin" className="w-full">
                <button className="justify-center btn btn-primary w-full">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="py-6">
        <BookingItemGrid />
      </div>
    </div>
  );
}

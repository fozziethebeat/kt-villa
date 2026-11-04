import Link from "next/link";
import { gql } from "@apollo/client";
import { CalendarPlus } from "lucide-react";

import { UserBookingCard } from "@/components/UserBookingCard";
import { getClient } from "@/graphql/ApolloClient";

const QUERY = gql`
  query UserBookingsQuery {
    userBookings {
      id
      startDate
      endDate
      numGuests
      status
      bookingCode
      item {
        id
        image
        text
      }
    }
  }
`;

export async function UserBookingsGrid() {
  let bookings: any[] = [];
  try {
    const { data } = await getClient().query({
      query: QUERY,
      fetchPolicy: "no-cache",
    });
    bookings = (data as any)?.userBookings ?? [];
  } catch {
    bookings = [];
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Stays You&apos;re Hosting ({bookings.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Click any trip to manage co-travelers, guest counts, or view arrival guides.
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <p className="text-sm font-semibold text-foreground">
            You haven&apos;t hosted a trip at KT Villa yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Check the live calendar on the home page to book your first mountain getaway.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Browse Open Dates
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <UserBookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </section>
  );
}

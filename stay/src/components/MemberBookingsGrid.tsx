import { gql } from "@apollo/client";

import { MemberBookingCard } from "@/components/MemberBookingCard";
import { getClient } from "@/graphql/ApolloClient";

export const QUERY = gql`
  query MemberBookingsQuery {
    memberBookings {
      id
      status
      booking {
        bookingCode
        startDate
        endDate
        numGuests
      }
      item {
        image
      }
    }
  }
`;

export async function MemberBookingsGrid() {
  let memberBookings: any[] = [];
  try {
    const { data } = await getClient().query({
      query: QUERY,
      fetchPolicy: "no-cache",
    });
    memberBookings = (data as any)?.memberBookings ?? [];
  } catch {
    memberBookings = [];
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Trips You&apos;ve Joined as Co-Traveler ({memberBookings.length})
        </h2>
        <p className="text-xs text-muted-foreground">
          Stays hosted by friends where you are registered as a member.
        </p>
      </div>

      {memberBookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-xs text-muted-foreground">
          You haven&apos;t joined any friend-hosted trips yet. You can request to
          join any upcoming trip with open spots from its public booking page.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {memberBookings.map((booking) => (
            <MemberBookingCard key={booking.id} memberBooking={booking} />
          ))}
        </div>
      )}
    </section>
  );
}

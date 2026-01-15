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
  const { data, error } = await getClient().query({ query: QUERY });
  return (
    <div>
      <div className="divider">Member Bookings</div>
      <div className="flex flex-wrap justify-center gap-2">
        {(data as any)?.memberBookings?.map((booking) => (
          <MemberBookingCard key={booking.id} memberBooking={booking} />
        ))}
      </div>
    </div>
  );
}

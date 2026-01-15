import { gql } from "@apollo/client";

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
  const { data, error } = await getClient().query({ query: QUERY });
  return (
    <div>
      <div className="divider">Your Hosting Trips</div>
      <div className="flex flex-wrap justify-center gap-2">
        {(data as any)?.userBookings?.map((booking) => (
          <UserBookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
}

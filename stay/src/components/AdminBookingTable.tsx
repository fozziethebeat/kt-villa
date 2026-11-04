import { gql } from "@apollo/client";

import { getClient } from "@/graphql/ApolloClient";
import { AdminBookingTableClient } from "@/components/AdminBookingTableClient";

const QUERY = gql`
  query AdminBookingsQuery {
    adminBookings {
      id
      bookingCode
      startDate
      endDate
      numGuests
      maxGuests
      withCat
      withDog
      status
      user {
        name
        email
      }
      item {
        id
        image
        text
      }
    }
  }
`;

export async function AdminBookingTable() {
  try {
    const { data } = await getClient().query({
      query: QUERY,
      fetchPolicy: "no-cache",
    });
    const bookings = (data as any)?.adminBookings ?? [];
    return <AdminBookingTableClient bookings={bookings} />;
  } catch {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Unable to load bookings.
      </div>
    );
  }
}

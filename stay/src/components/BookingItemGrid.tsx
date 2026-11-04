import { gql } from "@apollo/client";

import { getClient } from "@/graphql/ApolloClient";
import { BookingGalleryClient } from "@/components/BookingGalleryClient";
import type { PublicBookingCardData } from "@/components/BookingItemCard";

const PUBLIC_BOOKINGS_QUERY = gql`
  query PublicBookingsQuery {
    publicBookings {
      id
      bookingCode
      startDate
      endDate
      status
      numGuests
      maxGuests
      withCat
      withDog
      hostName
      isOwner
      StableItem {
        id
        image
        text
        style
        season
        subject
      }
    }
  }
`;

export async function BookingItemGrid() {
  try {
    const { data } = await getClient().query<{
      publicBookings: PublicBookingCardData[];
    }>({
      query: PUBLIC_BOOKINGS_QUERY,
      fetchPolicy: "no-cache",
    });

    const bookings = data?.publicBookings ?? [];
    return <BookingGalleryClient bookings={bookings} />;
  } catch (err) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Unable to load bookings right now.
      </div>
    );
  }
}

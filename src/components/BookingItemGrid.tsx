import { gql } from "@apollo/client";

import { getClient } from "@/graphql/ApolloClient";
import { BookingItemCard } from "@/components/BookingItemCard";

const QUERY = gql`
  query BookingItemsQuery {
    bookingItems {
      id
      image
      text
      claimStatus
      claimVisible
      ownerUsername
    }
  }
`;

export async function BookingItemGrid() {
  try {
    const { data, error } = await getClient().query({ query: QUERY });
    return (
      <div className="flex flex-wrap justify-center gap-2">
        {data?.bookingItems?.map((item) => (
          <BookingItemCard key={item.id} item={item} />
        ))}
      </div>
    );
  } catch {
    return <div>No Data to fetch</div>;
  }
}

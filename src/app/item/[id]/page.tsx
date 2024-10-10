import { gql } from "@apollo/client";
import { getClient } from "@/graphql/ApolloClient";

const QUERY = gql`
  query BookingItemQuery($id: String!) {
    bookingItem(id: $id) {
      id
      image
      text
      claimStatus
      claimVisible
      ownerUsername
    }
  }
`;

export default async function ItemPage({ params }) {
  try {
    const { data, error } = await getClient().query({
      query: QUERY,
      variables: { id: params.id },
    });
    const bookingItem = data.bookingItem;
    return (
      <div className="min-h-screen w-full bg-neutral-200">
        <div className="hero-content flex-col items-start lg:flex-row">
          <figure className="h-[512px]  w-[512px]">
            <img src={bookingItem.image} />
          </figure>
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-bold">Item Code: {bookingItem.id}</h2>
            <div className="flex justify-between gap-2">
              <div>Owner</div>
              <div className="badge badge-neutral badge-lg">
                {bookingItem.ownerUsername}
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <div>Claimed</div>
              <div className="badge badge-primary badge-lg">
                {bookingItem.claimStatus}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch {
    return <div>No Data to fetch</div>;
  }
}

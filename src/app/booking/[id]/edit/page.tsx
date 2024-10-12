import { withAuth } from "@/lib/withAuth";
import { gql } from "@apollo/client";
import { getClient } from "@/graphql/ApolloClient";

import { EditUserBookingForm } from "@/components/EditUserBookingForm";

const QUERY = gql`
  query BookingItemQuery($bookingCode: String!) {
    userBooking: userBooking(bookingCode: $bookingCode) {
      id
      startDate
      endDate
      maxGuests
      numGuests
      withCat
      withDog
      bookingCode
      status
      item {
        id
        image
        text
      }
      member {
        id
        status
        user {
          name
        }
      }
    }
  }
`;

async function EditBookingPage({ params }) {
  try {
    const { data, error } = await getClient().query({
      query: QUERY,
      variables: { bookingCode: params.id },
    });
    return <EditUserBookingForm userBooking={data.userBooking} />;
  } catch (e) {
    console.log(e);
    return <div>whoops</div>;
  }
}

export default withAuth(EditBookingPage, "", "/");

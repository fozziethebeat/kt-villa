import { gql } from '@apollo/client';
import { getClient } from '@/graphql/ApolloClient';

import { checkAccess } from '@/lib/auth-check';
import { EditUserBookingForm } from '@/components/EditUserBookingForm';

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

export default async function EditBookingPage({ params }) {
  await checkAccess('', '/');
  try {
    const { data, error } = await getClient().query({
      query: QUERY,
      variables: { bookingCode: params.id },
    });
    return <EditUserBookingForm userBooking={(data as any).userBooking} />;
  } catch (e) {
    console.log(e);
    return <div>whoops</div>;
  }
}

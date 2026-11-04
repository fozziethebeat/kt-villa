import { redirect } from "next/navigation";
import { gql } from "@apollo/client";

import { getClient } from "@/graphql/ApolloClient";
import { checkAccess } from "@/lib/auth-check";
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

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkAccess("", "/signin");
  const { id } = await params;

  let userBooking: any = null;
  try {
    const { data } = await getClient().query({
      query: QUERY,
      variables: { bookingCode: id },
      fetchPolicy: "no-cache",
    });
    userBooking = (data as any)?.userBooking;
  } catch {
    userBooking = null;
  }

  if (!userBooking) {
    redirect(`/public-booking/${id}`);
  }

  return <EditUserBookingForm userBooking={userBooking} />;
}

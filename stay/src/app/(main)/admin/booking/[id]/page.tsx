import Link from "next/link";
import { gql } from "@apollo/client";

import { checkAccess } from "@/lib/auth-check";
import { getClient } from "@/graphql/ApolloClient";
import { EditAdminBookingForm } from "@/components/EditAdminBookingForm";

const QUERY = gql`
  query AdminBooking($id: Int!) {
    adminBooking(id: $id) {
      id
      startDate
      endDate
      numGuests
      maxGuests
      withCat
      withDog
      status
      bookingCode
      item {
        id
        image
        text
        style
        season
        subject
      }
      user {
        id
        name
        email
      }
      userId
    }
    users {
      id
      name
      email
    }
    imageAdapterSettings {
      id
      adapter
      promptTemplate
    }
  }
`;

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkAccess("admin", "/");
  const { id } = await params;

  try {
    const { data } = await getClient().query({
      query: QUERY,
      variables: { id: parseInt(id, 10) },
      fetchPolicy: "no-cache",
    });

    const booking = (data as any)?.adminBooking;
    const users = (data as any)?.users ?? [];
    const adapters = (data as any)?.imageAdapterSettings ?? [];

    if (!booking) {
      return (
        <div className="alpine-container py-12">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h1 className="text-xl font-bold text-foreground">
              Booking #{id} Not Found
            </h1>
            <Link
              href="/admin"
              className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Back to Admin Console
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="alpine-container py-8 lg:py-12">
        <EditAdminBookingForm
          booking={booking}
          users={users}
          adapters={adapters}
        />
      </div>
    );
  } catch (e) {
    return (
      <div className="alpine-container py-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-bold text-foreground">
            Unable to Load Booking #{id}
          </h1>
          <Link
            href="/admin"
            className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            Back to Admin Console
          </Link>
        </div>
      </div>
    );
  }
}

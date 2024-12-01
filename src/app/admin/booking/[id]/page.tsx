import { withAuth } from "@/lib/withAuth";
import { gql } from "@apollo/client";
import { getClient } from "@/graphql/ApolloClient";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EditAdminBookingForm } from "@/components/EditAdminBookingForm";

const QUERY = gql`
  query AdminBooking($id: Int!) {
    adminBooking(id: $id) {
      id
      startDate
      startDate
      endDate
      numGuests
      maxGuests
      withCat
      withDog
      status
      bookingCode
      item {
        image
      }
      user {
        id
        name
        email
      }
      userId
    }
  }
`;

async function EditBookingPage({ params }) {
  try {
    const { data, error } = await getClient().query({
      query: QUERY,
      variables: { id: parseInt(params.id) },
    });
    return (
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Booking</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <EditAdminBookingForm booking={data.adminBooking} />
      </div>
    );
  } catch (e) {
    console.log(e);
    return <div>whoops</div>;
  }
}

export default withAuth(EditBookingPage, "admin", "/");

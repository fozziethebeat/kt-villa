import { gql } from "@apollo/client";
import Link from "next/link";

import { getClient } from "@/graphql/ApolloClient";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const QUERY = gql`
  query AdminBookingsQuery {
    adminBookings {
      id
      bookingCode
      startDate
      endDate
      numGuests
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
    const { data, error } = await getClient().query({ query: QUERY });
    return (
      <Card x-chunk="dashboard-05-chunk-3">
        <CardHeader className="px-7">
          <CardTitle>Bookings</CardTitle>
          <CardDescription>Visitor Bookings to Review.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Start Date
                </TableHead>
                <TableHead className="hidden sm:table-cell">End Date</TableHead>
                <TableHead className="hidden md:table-cell">
                  Num Guests
                </TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data as any).adminBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium">{booking.user.name}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(booking.startDate).toLocaleDateString("en-CA")}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(booking.endDate).toLocaleDateString("en-CA")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {booking.numGuests}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {booking.status}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Link href={`/admin/booking/${booking.id}`}>Edit</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  } catch {
    return <div>No Data to fetch</div>;
  }
}

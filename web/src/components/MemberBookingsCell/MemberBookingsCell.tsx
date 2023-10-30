import type { MemberBookingsQuery } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { Link, routes } from '@redwoodjs/router'
import MemberBookingCard from 'src/components/MemberBookingCard'

export const QUERY = gql`
  query MemberBookingsQuery {
    memberBookings {
      id
      status
      booking {
        bookingCode
        startDate
        endDate
        numGuests
      }
      item {
        image
      }
    }
  }
`

export const Loading = () => (
  <>
    <div className="divider">Your Bookings</div>
    <div>Loading...</div>
  </>
)

export const Empty = () => (
  <div>
    <div className="divider">Your Bookings</div>
    <Link to={routes.home()}>
      <button className="btn btn-primary">Join a trip!</button>
    </Link>
  </div>
)

export const Failure = ({ error }: CellFailureProps) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  memberBookings,
}: CellSuccessProps<MemberBookingsQuery>) => {
  return (
    <>
      <div className="divider">Member Bookings</div>
      <div className="flex flex-wrap justify-center gap-2">
        {memberBookings.map((item) => (
          <MemberBookingCard key={item.id} memberBooking={item} />
        ))}
      </div>
    </>
  )
}

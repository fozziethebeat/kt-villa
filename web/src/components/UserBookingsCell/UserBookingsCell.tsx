import type { UserBookingsQuery } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { Link, routes } from '@redwoodjs/router'

import UserBookingCard from 'src/components/UserBookingCard'

export const QUERY = gql`
  query UserBookingsQuery {
    userBookings {
      id
      startDate
      endDate
      numGuests
      status
      bookingCode
      item {
        id
        image
        text
      }
    }
  }
`

export const Loading = () => (
  <>
    <div className="divider">Your Hosting Trips</div>
    <div>Loading...</div>
  </>
)

export const Empty = () => (
  <>
    <div>
      <div className="divider">Your Hosting Trips</div>
      <Link to={routes.home()}>
        <button className="btn btn-secondary">Host a trip!</button>
      </Link>
    </div>
  </>
)

export const Failure = ({ error }: CellFailureProps) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  userBookings,
}: CellSuccessProps<UserBookingsQuery>) => {
  return (
    <>
      <div className="divider">Your Hosting Trips</div>
      <div className="flex flex-wrap justify-center gap-2">
        {userBookings.map((item) => (
          <UserBookingCard key={item.id} booking={item} />
        ))}
      </div>
    </>
  )
}

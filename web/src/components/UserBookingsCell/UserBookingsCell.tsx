import type { UserBookingsQuery } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

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
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  userBookings,
}: CellSuccessProps<UserBookingsQuery>) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {userBookings.map((item) => (
        <UserBookingCard key={item.id} booking={item} />
      ))}
    </div>
  )
}

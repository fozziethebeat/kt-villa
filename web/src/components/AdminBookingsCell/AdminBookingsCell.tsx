import type { AdminBookingsQuery } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import AdminBookingCard from 'src/components/AdminBookingCard'

export const QUERY = gql`
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
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  adminBookings,
}: CellSuccessProps<AdminBookingsQuery>) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {adminBookings.map((item) => (
        <AdminBookingCard key={item.id} booking={item} />
      ))}
    </div>
  )
}

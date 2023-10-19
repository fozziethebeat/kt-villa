import type { MemberBookingsQuery } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

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

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  memberBookings,
}: CellSuccessProps<MemberBookingsQuery>) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {memberBookings.map((item) => (
        <MemberBookingCard key={item.id} memberBooking={item} />
      ))}
    </div>
  )
}

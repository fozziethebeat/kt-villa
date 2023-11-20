import type { PublicBookingsQuery } from 'types/graphql'

import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { Link, routes } from '@redwoodjs/router'

import PublicBookingCard from 'src/components/PublicBookingCard'

export const QUERY = gql`
  query PublicBookingsQuery {
    publicBookings {
      id
      bookingCode
      startDate
      endDate
      numGuests
      item {
        image
      }
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => (
  <div className="center-center m-4 flex h-full justify-center">
    No trips to join yet
  </div>
)

export const Failure = ({ error }: CellFailureProps) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  publicBookings,
}: CellSuccessProps<PublicBookingsQuery>) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {publicBookings.map((item) => (
        <PublicBookingCard key={item.id} publicBooking={item} />
      ))}
    </div>
  )
}

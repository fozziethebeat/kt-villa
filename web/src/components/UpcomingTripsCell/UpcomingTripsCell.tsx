import type { PublicBookingsQuery } from 'types/graphql'

import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { Link, routes } from '@redwoodjs/router'

export const QUERY = gql`
  query UpcomingTripsQuery {
    publicBookings(limit: 3) {
      id
      bookingCode
      startDate
      endDate
      numGuests
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
    <>
      <div className="divider">Upcoming Trips</div>
      <div className="flex flex-col gap-4">
        {publicBookings.map((item) => (
          <PublicBookingItem key={item.id} publicBooking={item} />
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Link className="link" to={routes.publicBookings()}>
          See More Trips
        </Link>
      </div>
    </>
  )
}

const PublicBookingItem = ({ publicBooking }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex max-w-full justify-between ">
        <div className="badge badge-ghost badge-lg">
          {new Date(publicBooking.startDate).toLocaleDateString('en-CA')}
        </div>
        <div>→</div>
        <div className="badge badge-ghost badge-lg">
          {new Date(publicBooking.endDate).toLocaleDateString('en-CA')}
        </div>
      </div>
      <div className="flex max-w-full justify-between ">
        <div className="flex justify-between gap-2">
          <div>Trip Size</div>
          <div className="badge badge-accent badge-lg">
            {publicBooking.numGuests}
          </div>
        </div>
        <Link
          to={routes.publicBooking({ bookingCode: publicBooking.bookingCode })}
          className="link"
        >
          See Details
        </Link>
      </div>
    </div>
  )
}

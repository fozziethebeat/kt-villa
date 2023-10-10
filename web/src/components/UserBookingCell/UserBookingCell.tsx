import type {
  FindUserBookingQuery,
  FindUserBookingQueryVariables,
} from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

export const QUERY = gql`
  query FindUserBookingQuery($bookingCode: String!) {
    userBooking: userBooking(bookingCode: $bookingCode) {
      id
      startDate
      endDate
      numGuests
      bookingCode
      status
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({
  error,
}: CellFailureProps<FindUserBookingQueryVariables>) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  userBooking,
}: CellSuccessProps<FindUserBookingQuery, FindUserBookingQueryVariables>) => {
  return (
    <div className="flex flex-row gap-8">
      <div className="flex flex-col ">
        <div>
          <div className="badge badge-neutral">{userBooking.status}</div>
        </div>
        <h2 className="card-title">{userBooking.bookingCode}</h2>
        <div className="w-full max-w-xs">
          <label className="label">
            <span className="label-text">Start Date</span>
          </label>
          <span className="input input-bordered w-full max-w-xs">
            {new Date(userBooking.startDate).toLocaleDateString('en-CA')}
          </span>
          <label className="label">
            <span className="label-text">End Date</span>
          </label>
          <span className="input input-bordered w-full max-w-xs">
            {new Date(userBooking.endDate).toLocaleDateString('en-CA')}
          </span>
          <label className="label">
            <span className="label-text">Number of Guests</span>
          </label>
          <span className="input input-bordered w-full max-w-xs">
            {userBooking.numGuests}
          </span>
        </div>
      </div>
    </div>
  )
}

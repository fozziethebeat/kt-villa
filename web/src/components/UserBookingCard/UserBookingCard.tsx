import { Link, routes } from '@redwoodjs/router'

const UserBookingCard = ({ booking }) => {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <div>
          <div className="badge badge-neutral">{booking.status}</div>
        </div>
        <h2 className="card-title">{booking.bookingCode}</h2>
        <div className="w-full max-w-xs">
          <label className="label">
            <span className="label-text">Start Date</span>
          </label>
          <span className="input input-bordered w-full max-w-xs">
            {new Date(booking.startDate).toLocaleDateString('en-CA')}
          </span>
          <label className="label">
            <span className="label-text">End Date</span>
          </label>
          <span className="input input-bordered w-full max-w-xs">
            {new Date(booking.endDate).toLocaleDateString('en-CA')}
          </span>
          <label className="label">
            <span className="label-text">Number of Guests</span>
          </label>
          <span className="input input-bordered w-full max-w-xs">
            {booking.numGuests}
          </span>
        </div>
        <Link to={routes.userBooking({ bookingCode: booking.bookingCode })}>
          <button className="btn btn-primary"> See More</button>
        </Link>
      </div>
    </div>
  )
}

export default UserBookingCard

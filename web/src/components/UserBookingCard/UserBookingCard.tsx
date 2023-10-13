import { Link, routes } from '@redwoodjs/router'

const UserBookingCard = ({ booking }) => {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Trip: {booking.bookingCode}</h2>
        <div className="flex w-full flex-col gap-2">
          <div className="flex justify-between gap-2">
            <div>Status</div>
            <div className="badge badge-neutral badge-lg">{booking.status}</div>
          </div>
          <div className="flex justify-between gap-2">
            <div>Start Date</div>
            <div className="badge badge-ghost badge-lg">
              {new Date(booking.startDate).toLocaleDateString('en-CA')}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <div>End Date</div>
            <div className="badge badge-ghost badge-lg">
              {new Date(booking.endDate).toLocaleDateString('en-CA')}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <div>Number of Guests</div>
            <div className="badge badge-accent badge-lg">
              {booking.numGuests}
            </div>
          </div>
        </div>
        <figure className="h-80 w-80">
          {booking?.item ? (
            <img src={booking.item.image} />
          ) : (
            <div className=" placeholder h-80 w-80 bg-neutral-content" />
          )}
        </figure>

        <Link to={routes.userBooking({ bookingCode: booking.bookingCode })}>
          <button className="btn btn-primary"> See More</button>
        </Link>
      </div>
    </div>
  )
}

export default UserBookingCard

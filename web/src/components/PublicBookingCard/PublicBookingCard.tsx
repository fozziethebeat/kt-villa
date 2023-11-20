import { Link, routes } from '@redwoodjs/router'

const PublicBookingCard = ({ publicBooking }) => {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex w-full flex-col gap-2">
          <div className="flex justify-between gap-2">
            <div>Code</div>
            <div className="badge badge-secondary badge-lg">
              {publicBooking.bookingCode}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <div>Start Date</div>
            <div className="badge badge-ghost badge-lg">
              {new Date(publicBooking.startDate).toLocaleDateString('en-CA')}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <div>End Date</div>
            <div className="badge badge-ghost badge-lg">
              {new Date(publicBooking.endDate).toLocaleDateString('en-CA')}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <div>Number of Guests</div>
            <div className="badge badge-accent badge-lg">
              {publicBooking.numGuests}
            </div>
          </div>
          <figure className="h-80 w-80">
            <img src={publicBooking.item.image} />
          </figure>
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

export default PublicBookingCard

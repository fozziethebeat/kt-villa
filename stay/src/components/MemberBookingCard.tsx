import Link from 'next/link';

export function MemberBookingCard({memberBooking}) {
  const booking = memberBooking.booking;
  return (
    <div className="card w-96 bg-base-300 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Member Trip: {booking.bookingCode}</h2>
        <div className="flex w-full flex-col gap-2">
          <div className="flex justify-between gap-2">
            <div>Status</div>
            <div className="badge badge-neutral badge-lg">
              {memberBooking.status}
            </div>
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
          {memberBooking?.item ? (
            <img src={memberBooking.item.image} />
          ) : (
            <div className=" placeholder h-80 w-80 bg-neutral-content" />
          )}
        </figure>

        <Link href={`/public-booking/${booking.bookingCode}`}>
          <button className="btn btn-primary"> See Full Booking</button>
        </Link>
      </div>
    </div>
  );
}

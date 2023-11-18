import { Link, navigate, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { useState } from 'react'

import { useAuth } from 'src/auth'
import BookingDatePickerCell from 'src/components/BookingDatePickerCell'
import PublicBookingsCell from 'src/components/PublicBookingsCell'

const CREATE_BOOKING_MUTATION = gql`
  mutation CreateBookingMutation($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      bookingCode
    }
  }
`

const BookingHero = () => {
  const { currentUser, hasRole } = useAuth()
  const canBook = hasRole(['admin', 'trusted'])
  return (
    <div
      className="hero min-h-screen bg-base-200"
      style={{
        backgroundImage:
          'url(https://www.hakubavalley.com/cms/wp-content/themes/hv_themes/common/img/top-bg-about.jpg)',
      }}
    >
      <div className="z-1 hero-content z-10 flex-col">
        <div className="lg:-left text-center text-neutral-content">
          <h1 className="text-5xl font-bold">Register for a stay!</h1>
          <p className="py-6">
            Join us for a long weekend in Hakuba!
            <Link to={routes.about()}> Find out more</Link>
          </p>
        </div>
        <div className="card h-80 w-[400px] flex-shrink-0 bg-base-100 p-4 shadow-2xl">
          {canBook ? <TrustedUserContent /> : <MemberBookingForm />}
        </div>
      </div>
    </div>
  )
}

const TrustedUserContent = () => (
  <div role="tablist" className="tabs tabs-bordered w-full">
    <input
      type="radio"
      name="my_tabs_1"
      role="tab"
      className="tab"
      label="New Trip"
      aria-label="New Trip"
      defaultChecked
    />
    <div role="tabpanel" className="tab-content">
      <AdminBookingForm />
    </div>

    <input
      type="radio"
      name="my_tabs_1"
      role="tab"
      className="tab"
      aria-label="Join a trip"
    />
    <div role="tabpanel" className="tab-content">
      <MemberBookingForm />
    </div>
  </div>
)

const AdminBookingForm = () => {
  const [createBooking, { loading, error }] = useMutation(
    CREATE_BOOKING_MUTATION,
    {
      onCompleted: (data) => {
        navigate(
          routes.userBooking({ bookingCode: data.createBooking.bookingCode })
        )
      },
    }
  )

  const onBook = () => {
    createBooking({
      variables: {
        input: {
          startDate,
          endDate,
          numGuests,
        },
      },
    })
  }

  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [isValidDates, setIsValidDates] = useState(false)
  const [numGuests, setNumGuests] = useState(1)

  const onChange = (newStart, newEnd, isValid) => {
    setStartDate(newStart)
    setEndDate(newEnd)
    setIsValidDates(isValid)
  }

  return (
    <div className="my-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Trip Dates</span>
        </label>
        <div className="flex justify-center">
          <div className="indicator">
            <BookingDatePickerCell
              className="place-items-center"
              startDate={startDate}
              endDate={endDate}
              onChange={onChange}
            />
            <span
              className={`indicator-bottom badge indicator-item ${
                isValidDates ? 'badge-primary' : 'badge-accent'
              }`}
            >
              {isValidDates ? 'Valid' : 'Invalid'}
            </span>
          </div>
        </div>
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Guests</span>
        </label>
        <input
          type="range"
          min={1}
          max="4"
          value={numGuests}
          onChange={(e) => setNumGuests(e.target.valueAsNumber)}
          className="range"
          step="1"
        />
        <div className="flex w-full justify-between px-2 text-xs">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
        </div>
      </div>
      <div className="form-control mt-6">
        <button
          disabled={!isValidDates || loading}
          onClick={onBook}
          className="btn btn-primary"
        >
          Book
        </button>
      </div>
      <div className="flex justify-center">
        <progress
          className={`progress progress-success w-56 ${
            loading ? 'visible' : 'invisible'
          }`}
        />
      </div>
    </div>
  )
}

const MemberBookingForm = () => {
  const [createBooking, { loading, error }] = useMutation(
    CREATE_BOOKING_MUTATION,
    {
      onCompleted: (data) => {
        navigate(
          routes.userBooking({ bookingCode: data.createBooking.bookingCode })
        )
      },
    }
  )

  const onBook = () => {
    createBooking({
      variables: {
        input: {
          startDate,
          endDate,
          numGuests,
        },
      },
    })
  }

  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [isValidDates, setIsValidDates] = useState(false)
  const [numGuests, setNumGuests] = useState(1)

  const onChange = (newStart, newEnd, isValid) => {
    setStartDate(newStart)
    setEndDate(newEnd)
    setIsValidDates(isValid)
  }

  return <PublicBookingsCell />
}

export default BookingHero

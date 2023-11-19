import { CheckboxField, Form, RangeField, Submit } from '@redwoodjs/forms'
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
        <div className="card h-96 w-[400px] flex-shrink-0 bg-base-100 p-4 shadow-2xl">
          {canBook ? <TrustedUserContent /> : <PublicBookingsCell />}
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
      <PublicBookingsCell />
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

  const onSubmit = (data) => {
    createBooking({
      variables: {
        input: {
          startDate,
          endDate,
          ...data,
        },
      },
    })
  }

  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [isValidDates, setIsValidDates] = useState(false)

  const onChange = (newStart, newEnd, isValid) => {
    setStartDate(newStart)
    setEndDate(newEnd)
    setIsValidDates(isValid)
  }

  return (
    <div className="my-2">
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

      <Form onSubmit={onSubmit} error={error}>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Max Guests</span>
          </label>
          <RangeField
            name="maxGuests"
            type="range"
            min={1}
            max={5}
            defaultValue={4}
            className="range"
            step="1"
            validation={{ valueAsNumber: true }}
          />
          <div className="flex w-full justify-between px-2 text-xs">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Known Guests</span>
          </label>
          <RangeField
            name="numGuests"
            type="range"
            min={1}
            max={5}
            defaultValue={1}
            className="range"
            step="1"
            validation={{ valueAsNumber: true }}
          />
          <div className="flex w-full justify-between px-2 text-xs">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>

        <div className="grid  grid-cols-2 gap-4">
          <label className="label cursor-pointer gap-2">
            <span className="label-text">With Cat</span>
            <CheckboxField name="withCat" type="checkbox" className="toggle" />
          </label>
          <label className="label cursor-pointer">
            <span className="label-text">With Dog</span>
            <CheckboxField name="withDog" type="checkbox" className="toggle" />
          </label>
        </div>

        <div className="form-control mt-2">
          <Submit
            disabled={!isValidDates || loading}
            className="btn btn-primary btn-sm"
          >
            {loading && <span className="loading loading-spinner" />}
            Book
          </Submit>
        </div>
      </Form>
    </div>
  )
}

export default BookingHero

import type {
  FindUserBookingQuery,
  FindUserBookingQueryVariables,
} from 'types/graphql'

import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { CheckboxField, Form, RangeField, Submit } from '@redwoodjs/forms'
import { navigate, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { FaCat, FaDog } from 'react-icons/fa'

export const QUERY = gql`
  query UserBooking($bookingCode: String!) {
    userBooking(bookingCode: $bookingCode) {
      id
      startDate
      endDate
      maxGuests
      numGuests
      withCat
      withDog
      bookingCode
      status
      item {
        id
        image
        text
      }
    }
  }
`

const MUTATION = gql`
  mutation UpdateBooking($id: Int!, $input: UpdateBookingInput!) {
    updateBooking(id: $id, input: $input) {
      id
      startDate
      endDate
      maxGuests
      numGuests
      withCat
      withDog
      bookingCode
      status
      item {
        id
        image
        text
      }
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
  const [updateBooking, { loading, error }] = useMutation(MUTATION, {
    onCompleted: () => {
      navigate(routes.userBooking({ bookingCode: userBooking.bookingCode }))
    },
  })

  const onSubmit = (data) => {
    updateBooking({
      variables: {
        id: userBooking.id,
        input: data,
      },
    })
  }
  return (
    <div className="min-h-screen w-full bg-base-200">
      <div className="hero-content flex-col items-start lg:flex-row">
        <figure className="h-96 w-96">
          {userBooking?.item ? (
            <img src={userBooking.item.image} />
          ) : (
            <div className="placeholder h-96 w-96 bg-neutral-content" />
          )}
        </figure>
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-bold">
            Booking Code: {userBooking.bookingCode}
          </h2>
          <div className="flex justify-between gap-2">
            <div>Status</div>
            <div className="badge badge-accent badge-lg">
              {userBooking.status}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <div>Start Date</div>
            <div className="badge badge-ghost badge-lg">
              {new Date(userBooking.startDate).toLocaleDateString('en-CA')}
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <div>End Date</div>
            <div className="badge badge-ghost badge-lg">
              {new Date(userBooking.endDate).toLocaleDateString('en-CA')}
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
                defaultValue={userBooking?.maxGuests}
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
                defaultValue={userBooking?.numGuests}
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
                <CheckboxField
                  name="withCat"
                  type="checkbox"
                  className="toggle"
                  defaultChecked={userBooking?.withCat}
                />
              </label>
              <label className="label cursor-pointer">
                <span className="label-text">With Dog</span>
                <CheckboxField
                  name="withDog"
                  type="checkbox"
                  className="toggle"
                  defaultChecked={userBooking?.withDog}
                />
              </label>
            </div>

            <div className="form-control mt-2">
              <Submit disabled={loading} className="btn btn-primary btn-sm">
                {loading && <span className="loading loading-spinner" />}
                Update
              </Submit>
            </div>
          </Form>
        </div>
      </div>
    </div>
  )
}

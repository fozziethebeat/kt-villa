import type {
  FindUserBookingQuery,
  FindUserBookingQueryVariables,
} from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'
import {
  Form,
  FormError,
  FieldError,
  Label,
  TextField,
  SelectField,
  Submit,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'

export const QUERY = gql`
  query FindUserBookingQuery($bookingCode: String!) {
    userBooking: userBooking(bookingCode: $bookingCode) {
      id
      startDate
      endDate
      numGuests
      bookingCode
      status
      item {
        id
        image
        text
      }
      member {
        id
        status
        user {
          name
        }
      }
    }
  }
`

const MUTATION = gql`
  mutation UpdateMemberBookingStatus($id: Int!, $status: String!) {
    updateMemberBookingStatus(id: $id, status: $status) {
      id
      status
    }
  }
`
const ADD_MUTATION = gql`
  mutation addMemberBooking($id: Int!, $username: String!) {
    addMemberBooking(id: $id, username: $username) {
      id
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
  const numToRegister = userBooking.numGuests - userBooking.member.length - 1
  const toRegister = Array(numToRegister)
    .fill(0)
    .map((_, i) => i)
  console.log(toRegister)
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
          <div className="flex justify-between gap-2">
            <div>Number of Guests</div>
            <div className="badge badge-accent badge-lg">
              {userBooking.numGuests}
            </div>
          </div>
          <div className="overflow-x-auto">
            <div>
              {toRegister.map((tid, index) => (
                <MemberRegisterAction
                  key={`mra-${index}`}
                  booking={userBooking}
                />
              ))}
            </div>

            <table className="table">
              {/* head */}
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {userBooking.member.map((mb, index) => (
                  <tr key={`mb-${index}`}>
                    <th>{index + 1}</th>
                    <td>{mb.user.name}</td>
                    <td>
                      <MemberBookingAction
                        memberBooking={mb}
                        booking={userBooking}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const MemberRegisterAction = ({ booking }) => {
  const [addMemberBooking, { loading, error }] = useMutation(ADD_MUTATION, {
    refetchQueries: [
      { query: QUERY, variables: { bookingCode: booking.bookingCode } },
    ],
  })
  const onSave = (input) => {
    addMemberBooking({
      variables: {
        id: booking.id,
        ...input,
      },
    })
  }

  return (
    <Form onSubmit={onSave} error={error} className="flex gap-2 p-2">
      <div className="form-control w-full max-w-xs">
        <TextField
          name="username"
          className="input input-bordered w-full max-w-xs"
          placeholder="Username"
          autoComplete="off"
          validation={{
            required: {
              value: true,
              message: 'Username is required',
            },
          }}
        />
        <label className="label">
          <FieldError name="username" className="label-text-alt" />
        </label>
      </div>
      <Submit disabled={loading} className="btn btn-primary">
        Register
      </Submit>
    </Form>
  )
}

const MemberBookingAction = ({ memberBooking, booking }) => {
  const [updateMemberBookingStatus, { loading, error }] = useMutation(
    MUTATION,
    {
      refetchQueries: [
        { query: QUERY, variables: { bookingCode: booking.bookingCode } },
      ],
    }
  )
  const onSave = (input) => {
    updateMemberBookingStatus({
      variables: {
        id: memberBooking.id,
        ...input,
      },
    })
  }

  return (
    <Form onSubmit={onSave} error={error} className="flex flex-col gap-2">
      <SelectField
        name="status"
        defaultValue={memberBooking.status}
        className="select select-bordered"
        errorClassName="rw-input rw-input-error"
        validation={{ required: true }}
      >
        <option>approved</option>
        <option>pending</option>
        <option>rejected</option>
      </SelectField>

      <div>
        <Submit disabled={loading} className="btn btn-primary">
          Update
        </Submit>
      </div>
    </Form>
  )
}

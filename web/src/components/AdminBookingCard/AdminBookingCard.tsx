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
import { toast } from '@redwoodjs/web/toast'

import { QUERY as AdminBookingsQuery } from 'src/components/AdminBookingsCell'

const MUTATION = gql`
  mutation UpdateBookingStatus($id: Int!, $status: String!) {
    updateBookingStatus(id: $id, status: $status) {
      id
    }
  }
`

const AdminBookingCard = ({ booking }) => {
  const [updateBookingStatus, { loading, error }] = useMutation(MUTATION, {
    refetchQueries: [{ query: AdminBookingsQuery }],
  })
  const onSave = (input) => {
    updateBookingStatus({
      variables: {
        id: booking.id,
        ...input,
      },
    })
  }

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex w-full flex-col gap-2">
          <div className="flex justify-between gap-2">
            <div>Name</div>
            <div className="badge badge-neutral badge-lg">
              {booking.user.name}
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <div>Code</div>
            <div className="badge badge-secondary badge-lg">
              {booking.bookingCode}
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
        <Form onSubmit={onSave} error={error} className="flex flex-col gap-2">
          <Label
            name="status"
            className="label"
            errorClassName="rw-label rw-label-error"
          >
            Status
          </Label>

          <SelectField
            name="status"
            defaultValue={booking.status}
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
              Update Status
            </Submit>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default AdminBookingCard

import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import AdminEditBookingCell from 'src/components/AdminEditBookingCell'

type EditBookingsPageProps = {
  id: Int
}

const EditBookingsPage = ({ id }: EditBookingsPageProps) => {
  return (
    <>
      <MetaTags title="EditBookings" description="EditBookings page" />

      <AdminEditBookingCell id={id} />
    </>
  )
}

export default EditBookingsPage

import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import AdminBookingsCell from 'src/components/AdminBookingsCell'
const ReviewBookingsPage = () => {
  return (
    <>
      <MetaTags title="ReviewBookings" description="ReviewBookings page" />

      <AdminBookingsCell />
    </>
  )
}

export default ReviewBookingsPage

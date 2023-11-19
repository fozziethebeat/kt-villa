import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import EditUserBookingCell from 'src/components/EditUserBookingCell/EditUserBookingCell'

interface EditUserBookingPageProps {
  bookingCode: string
}

const EditUserBookingPage = ({ bookingCode }: EditUserBookingPageProps) => {
  return (
    <>
      <MetaTags title="EditUserBooking" description="EditUserBooking page" />

      <EditUserBookingCell bookingCode={bookingCode} />
    </>
  )
}

export default EditUserBookingPage

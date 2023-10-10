import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import UserBookingCell from 'src/components/UserBookingCell'

type UserBookingPageProps = {
  bookingCode: string
}

const UserBookingPage = ({ bookingCode }: UserBookingPageProps) => {
  return (
    <>
      <MetaTags title="UserBooking" description="UserBooking page" />

      <UserBookingCell bookingCode={bookingCode} />
    </>
  )
}

export default UserBookingPage

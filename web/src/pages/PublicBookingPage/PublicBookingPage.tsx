import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import PublicBookingCell from 'src/components/PublicBookingCell'

type PublicBookingPageProps = {
  bookingCode: string
}

const PublicBookingPage = ({ bookingCode }: PublicBookingPageProps) => {
  return (
    <>
      <MetaTags title="PublicBooking" description="PublicBooking page" />

      <PublicBookingCell bookingCode={bookingCode} />
    </>
  )
}

export default PublicBookingPage

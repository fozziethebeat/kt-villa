import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import PublicBookingsCell from 'src/components/PublicBookingsCell/PublicBookingsCell'
const PublicBookingsPage = () => {
  return (
    <>
      <MetaTags title="PublicBookings" description="PublicBookings page" />

      <PublicBookingsCell />
    </>
  )
}

export default PublicBookingsPage
